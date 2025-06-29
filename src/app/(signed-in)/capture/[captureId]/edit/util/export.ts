"use client";
import Konva from "konva";
import { toast } from "sonner";
import { Capture } from "@prisma/client";
import { DateTime } from "luxon";
import plimit from "p-limit";

import { createTrace, generatePresignedVHUpload } from "@/lib/actions";
import { uploadToS3 } from "@/lib/aws/s3/client";

import { FrameData, TraceFormData, Redaction } from "../components/types";
import { computeIoU } from "./iou";

export async function handleSave(data: TraceFormData, capture: Capture) {
  // Transpose gestures on to screens
  let screens = data.screens.map((screen: FrameData) => {
    const gesture = data.gestures[screen.id] ?? {
      type: null,
      x: null,
      y: null,
      scrollDeltaX: null,
      scrollDeltaY: null,
      description: null,
    };
    const redactions = data.redactions[screen.id] ?? [];
    return {
      id: screen.id,
      src: screen.src,
      vh: "",
      created: new Date(),
      gesture,
      redactions: redactions,
    };
  });

  const limit = plimit(3);
  const uploadScreenResponse = await Promise.all(
    screens.map((screen: any) =>
      limit(async () => {
        const res = await fetch(screen.src);
        if (!res.ok) {
          toast.error("Failed to fetch screen image.");
          throw new Error("Failed to fetch screen image.");
        }

        const blob = await res.blob();
        const file = new File([blob], `${screen.id}.png`, {
          type: "image/png",
        });

        const prefix = `uploads/${capture.id}/screens`;
        const fileName = `${DateTime.now()}.png`;
        const uploadRes = await uploadToS3(file, prefix, fileName, file.type);

        if (!uploadRes || !uploadRes.ok) {
          toast.error("Failed to upload screen image.");
          throw new Error("Failed to upload screen image.");
        }

        // Set screen src to S3 URL if no redaction
        if (!data.redactions[screen.id]) {
          screens.find((s: any) => s.id === screen.id)!.src =
            uploadRes.data.fileUrl;
        }

        return uploadRes;
      })
    )
  );

  if (!uploadScreenResponse || uploadScreenResponse.some((res) => !res.ok)) {
    toast.error("Failed to upload screen images.");
    return Promise.reject("Failed to upload screen images.");
  }

  const uploadRedactionScreenResponse = await Promise.all(
    screens.map((screen: any) =>
      limit(async () => {
        if (!data.redactions[screen.id]) {
          return { ok: true, message: "No redactions", data: null };
        }

        // Get redaction image
        const dataURL = await exportRedactedImage(
          data.redactions[screen.id],
          screen.src
        );

        if (!dataURL) {
          toast.error("Failed to export redacted image.");
          throw new Error("Failed to export redacted image.");
        }

        // Create a new file from the data URL
        const byteString = atob(dataURL.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const file = new File([ab], `${screen.id}.png`, { type: "image/png" });

        const prefix = `uploads/${capture.id}/redacted-screens`;
        const fileName = `${DateTime.now()}.png`;
        const uploadRes = await uploadToS3(file, prefix, fileName, file.type);

        if (!uploadRes.ok) {
          toast.error("Failed to upload redacted image.");
          throw new Error("Failed to upload redacted image.");
        }

        // Set screen src to S3 URL
        screens.find((s: any) => s.id === screen.id)!.src =
          uploadRes.data.fileUrl;

        return uploadRes;
      })
    )
  );

  if (
    !uploadRedactionScreenResponse ||
    uploadRedactionScreenResponse.some((res) => !res.ok)
  ) {
    toast.error("Failed to upload redacted screen images.");
    return Promise.reject("Failed to upload redacted screen images.");
  }

  // Cleaning up the screen objects
  screens = screens.map((screen: any) => {
    // delete screen id
    delete screen.id;

    // delete redaction id
    if (screen.redactions) {
      screen.redactions = screen.redactions.map((redaction: any) => {
        delete redaction.id;
        return redaction;
      });
    }
    return screen;
  });

  // check if there are view hierarchies, if so then upload them
  const vhs = data.vhs;
  if (vhs && Object.keys(vhs).length > 0) {
    const generateVHUploadRes = await Promise.all(
      screens.map(() =>
        limit(() => generatePresignedVHUpload(capture.id, "application/json"))
      )
    );

    if (!generateVHUploadRes || generateVHUploadRes.some((res) => !res.ok)) {
      toast.error(
        "Failed to upload screen images: Failed to generate presigned URLs."
      );
      return Promise.reject(
        "Failed to upload screen images: Failed to generate presigned URLs."
      );
    }

    // recurse through tree and check IoU with all redactions
    function redactVH(
      node: any,
      redactions: Redaction[],
      imgWidth: number,
      imgHeight: number
    ) {
      // check 
      if (node.bounds_in_screen) {
        const [left, top, right, bottom] = node.bounds_in_screen
          .split(" ")
          .map(Number);
        const width = right - left;
        const height = bottom - top;
        const x = left;
        const y = top;

        for (const r of redactions) {
          const redactionRect = {
            x: r.x * imgWidth,
            y: r.y * imgHeight,
            width: r.width * imgWidth,
            height: r.height * imgHeight,
          };

          const nodeRect = { x, y, width, height };

          const iou = computeIoU(redactionRect, nodeRect);
          if (iou > 0.1) {
            if ("content-desc" in node && node["content=desc"] !== "none") {
              node["content-desc"] = "REDACTED";
            }
            if ("text_field" in node) {
              node["text_field"] = "REDACTED";
            }
            break; // only redact once
          }
        }
      }
      // recursive case
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) =>
          redactVH(child, redactions, imgWidth, imgHeight)
        );
      }
    }

    const vhUploadRes = await Promise.all(
      data.screens.map((screen: FrameData, index: number) =>
        limit(async () => {
          let res;
          const vh = vhs[screen.id];

          // Try to determine image dimensions
          let imgWidth = 0;
          let imgHeight = 0;
          if (vh.bounds_in_screen) {
            const [left, top, right, bottom] = vh.bounds_in_screen
              .split(" ")
              .map(Number);
            imgWidth = right - left;
            imgHeight = bottom - top;
          } else {
            const image = new Image();
            await new Promise<void>((resolve, reject) => {
              image.onload = () => resolve();
              image.onerror = (err) => {
                console.error("Error loading image:", err);
                reject(new Error("Failed to load image"));
              };
              image.src = screen.src;
            });
            imgWidth = image.width;
            imgHeight = image.height;
          }

          const redactions = data.redactions[screen.id]
          if (redactions) {
            redactVH(vh, redactions, imgWidth, imgHeight);
          }

          if (!vh) {
            return { ok: false, message: "Failed to find view hierarchies." };
          }

          const uploadMeta = generateVHUploadRes[index];
          if (uploadMeta.ok) {
            res = await fetch(uploadMeta.data.uploadUrl, {
              method: "PUT",
              body: JSON.stringify(vh),
              headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
              toast.error("Failed to upload view hierarchies.");
              return {
                ok: false,
                message: "Failed to upload view hierarchies.",
              };
            }

            screens[index].vh = uploadMeta.data.fileUrl;
            return uploadMeta;
          }

          return { ok: false, message: "Presigned URL generation failed." };
        })
      )
    );

    if (!vhUploadRes || vhUploadRes.some((res) => !res!.ok)) {
      toast.error("Failed to upload screen view hierarchies.");
      return Promise.reject("Failed to upload screen view hierarchies.");
    }
  }

  // Create trace AND screen records, update user
  const trace = await createTrace(
    {
      name: "New Trace",
      description: data.description,
      app: {
        connect: {
          id: capture.appId!,
        },
      },
      captureId: capture.id,
      screens: {
        create: screens,
      },
      task: {
        connect: {
          id: capture.taskId,
        },
      },
      worker: "web",
    },
    {
      includes: {
        screens: true,
      },
    }
  );

  if (!trace.ok) {
    toast.error("Failed to create trace.");
    return Promise.reject("Failed to create trace.");
  }

  toast.success("Trace created successfully. Redirecting...");
}

export async function exportRedactedImage(
  redactions: Redaction[],
  image_src: string
) {
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => {
      resolve();
    };
    image.onerror = (err) => {
      console.error("Error loading image:", err);
      reject(new Error("Failed to load image"));
    };
    image.src = image_src;
  });

  if (!image.complete) {
    toast.error("Failed to load image.");
    return null;
  }

  // NOW it's guaranteed to be fully loaded
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "0";
  container.style.left = "0";
  container.style.zIndex = "-9999";
  container.style.width = `${image.width}px`;
  container.style.height = `${image.height}px`;
  container.style.backgroundImage = `url(${image.src})`;
  document.body.appendChild(container);

  // create Konva Stage, etc...
  document.body.appendChild(container);

  // create new canvas
  var renderStage = new Konva.Stage({
    container: container,
    width: image.width,
    height: image.height,
  });

  // create new layer
  const renderLayer = new Konva.Layer();
  renderStage.add(renderLayer);

  // create new image with original resolution
  const renderImage = new Konva.Image({
    image: image,
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  renderLayer.add(renderImage);

  // render redactions
  redactions.forEach((redaction) => {
    const rect = new Konva.Rect({
      x: redaction.x * image.width,
      y: redaction.y * image.height,
      width: redaction.width * image.width,
      height: redaction.height * image.height,
      fill: "black",
      opacity: 1,
    });
    renderLayer.add(rect);
  });
  renderLayer.batchDraw();

  // export the canvas to data URL
  const dataURL = renderStage.toDataURL({
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
    pixelRatio: 1,
    mimeType: "image/png",
  });

  // delete the container
  document.body.removeChild(container);

  return dataURL;
}
