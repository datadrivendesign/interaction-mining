"use client";
import { Capture, Screen } from "@prisma/client";
import { FrameData, TraceFormData } from "../components/types";
import { createTrace, generatePresignedVHUpload } from "@/lib/actions";
import { toast } from "sonner";
import Konva from "konva";
import { Redaction } from "../components/types";
import { uploadToS3 } from "@/lib/aws/s3/client";
import { DateTime } from "luxon";

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

  const uploadScreenResponse = await Promise.all(
    screens.map(async (screen: any) => {
      // get file from s3 url
      const res = await fetch(screen.src);
      if (!res.ok) {
        toast.error("Failed to fetch screen image.");
        return Promise.reject("Failed to fetch screen image.");
      }
      const blob = await res.blob();
      const file = new File([blob], `${screen.id}.png`, { type: "image/png" });

      const key = `${DateTime.now()}.png`;
      const prefix = `uploads/${capture.id}/screens`;
      const uploadRes = await uploadToS3(file, prefix, key);

      if (!uploadRes || !uploadRes.ok) {
        toast.error("Failed to upload screen image.");
        return Promise.reject("Failed to upload screen image.");
      }
      return uploadRes;
    })
  );

  if (!uploadScreenResponse || uploadScreenResponse.some((res) => !res.ok)) {
    toast.error("Failed to upload screen images.");
    return Promise.reject("Failed to upload screen images.");
  }

  const uploadRedactionScreenResponse = await Promise.all(
    screens.map(async (screen: any) => {
      console.log("here!!!", data.redactions, screen.id);

      if (!data.redactions[screen.id]) {
        return { ok: true, message: "No redactions", data: null };
      }

      // Get redaction image
      let dataURL = await exportRedactedImage(
        data.redactions[screen.id],
        screen.src
      );

      if (!dataURL) {
        toast.error("Failed to export redacted image.");
        return Promise.reject("Failed to export redacted image.");
      }

      // Create a new file from the data URL
      const byteString = atob(dataURL.split(",")[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const file = new File([ab], `${screen.id}.png`, { type: "image/png" });

      const key = `${DateTime.now()}.png`;
      const prefix = `uploads/${capture.id}/redacted-screens`;
      const uploadRes = await uploadToS3(file, prefix, key);

      if (!uploadRes.ok) {
        toast.error("Failed to upload redacted image.");
        return Promise.reject("Failed to upload redacted image.");
      }
      console.log("uploadRes", uploadRes);

      // Set screen src to S3 URL
      screens.find((s: any) => s.id === screen.id)!.src = uploadRes.data.fileUrl;
      return uploadRes;
    })
  );

  if (
    !uploadRedactionScreenResponse ||
    uploadRedactionScreenResponse.some((res) => !res.ok)
  ) {
    toast.error("Failed to upload redacted screen images.");
    return Promise.reject("Failed to upload redacted screen images.");
  }

  console.log("screens", screens);

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
      screens.map((_) => {
        return generatePresignedVHUpload(capture.id, "application/json");
      })
    );

    if (!generateVHUploadRes || generateVHUploadRes.some((res) => !res.ok)) {
      toast.error(
        "Failed to upload screen images: Failed to generate presigned URLs."
      );
      return Promise.reject(
        "Failed to upload screen images: Failed to generate presigned URLs."
      );
    }

    const vhUploadRes = await Promise.all(
      data.screens.map(async (screen: FrameData, index: number) => {
        var res;
        const vh = vhs[screen.id];
        if (!vh) {
          return { ok: false, message: "Failed to find view hierarchies." };
        }
        if (generateVHUploadRes[index].ok) {
          res = await fetch(generateVHUploadRes[index].data.uploadUrl, {
            method: "PUT",
            body: JSON.stringify(vh),
            headers: { "Content-Type": "application/json" },
          });

          if (!res.ok) {
            toast.error("Failed to upload view hierarchies.");
            return { ok: false, message: "Failed to upload view hierarchies." };
          }

          // Set screen src to S3 URL
          screens[index].vh = generateVHUploadRes[index].data.fileUrl;

          return generateVHUploadRes[index];
        }
      })
    );

    if (!vhUploadRes || vhUploadRes.some((res) => !res!.ok)) {
      toast.error("Failed to upload screen view hierarchies.");
      return Promise.reject("Failed to upload screen view hierarchies.");
    }
  }

  // Create trace AND screen records
  const trace = await createTrace(
    {
      name: "New Trace",
      description: data.description,
      app: {
        connect: {
          id: capture.appId_,
        },
      },
      task: {
        connect: {
          id: capture.taskId,
        },
      },
      screens: {
        create: screens,
      },
      worker: "web",
    },
    {
      includes: { screens: true },
    }
  );

  if (!trace.ok) {
    toast.error("Failed to create trace.");
    return Promise.reject("Failed to create trace.");
  }

  toast.success("Trace created successfully.");
}
