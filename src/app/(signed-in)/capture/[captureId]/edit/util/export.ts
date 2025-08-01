"use client";
import Konva from "konva";
import { toast } from "sonner";
import { Capture } from "@prisma/client";
import plimit from "p-limit";

import { createTrace, updateTrace } from "@/lib/actions";
import { uploadToS3 } from "@/lib/aws/s3/client";

import {
  FrameData,
  TraceFormData,
  Redaction,
  ScreenReviewData,
} from "../components/types";
import { computeIoU } from "./iou";
import { deleteFromS3, listFromS3 } from "@/lib/aws/s3/server";

export async function handleReviewSave(data: TraceFormData, capture: Capture) {
  // grab screen data from trace form data to serialize
  const screenData = data.screens.map((screen: FrameData) => {
    const gesture = data.gestures[screen.id] ?? {
      type: null,
      x: null,
      y: null,
      scrollDeltaX: null,
      scrollDeltaY: null,
      description: null,
    };
    const redactions = data.redactions[screen.id] ?? [];
    const vh = data.vhs ? data.vhs[screen.id] : "";
    return {
      id: screen.id,
      src: screen.src,
      timestamp: screen.timestamp,
      gesture: gesture,
      redactions: redactions,
      vh: vh,
      description: data.description,
    };
  });
  // if old screnens exist if processed folder, list them for deletion
  const prefix = `processed/${capture.id}/screens`;
  const oldFiles = await listFromS3(prefix);
  const oldFileKeys = oldFiles.ok
    ? oldFiles.data.map((file) => file.fileKey)
    : [];
  // upload screens as json to s3
  const limit = plimit(3);
  const uploadScreenResponse = await Promise.all(
    screenData.map((screen: ScreenReviewData) =>
      limit(async () => {
        const fileName = `${screen.id}.json`;
        const file = new File([JSON.stringify(screen)], fileName, {
          type: "application/json",
        });
        const uploadRes = await uploadToS3(file, prefix, fileName, file.type);
        if (!uploadRes || !uploadRes.ok) {
          toast.error("Failed to upload screen image.");
          return {
            ok: false,
            message: "Failed to upload screen image.",
          };
        }
        return uploadRes;
      })
    )
  );

  if (!uploadScreenResponse || uploadScreenResponse.some((res) => !res.ok)) {
    toast.error("Failed to upload screen data.");
    return Promise.reject("Failed to upload screen data.");
  }

  // delete old screens from /processed that no longer exist in the new screens
  if (oldFileKeys.length > 0) {
    const oldFileKeysToDelete = oldFileKeys.filter(
      (fileKey) =>
        !uploadScreenResponse.some(
          (res) =>
            "data" in res &&
            res.data &&
            res.data.fileKey &&
            res.data.fileKey === fileKey
        )
    );
    const deleteRes = await Promise.all(
      oldFileKeysToDelete.map((fileKey) => deleteFromS3(fileKey))
    );

    const failedDeletes = deleteRes.filter((res) => !res.ok);
    if (failedDeletes.length > 0) {
      console.warn("Failed to delete some old files:", failedDeletes);
      // Don't fail the operation - old files will be cleaned up later
    }
  }

  toast.success("Screen data uploaded successfully.");
}

export async function handleTraceSave(data: TraceFormData, capture: Capture) {
  // create a new trace without screens
  const traceRes = await createTrace({
    name: "New Trace",
    description: data.description,
    app: {
      connect: {
        id: capture.appId!,
      },
    },
    captureId: capture.id,
    task: {
      connect: {
        id: capture.taskId,
      },
    },
    worker: "web",
  });
  if (!traceRes.ok) {
    toast.error(traceRes.message ?? "Failed to create trace.");
    return Promise.reject(traceRes.message ?? "Failed to create trace.");
  }
  const trace = traceRes.data;
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
  // upload screens to s3
  const limit = plimit(3);
  const uploadScreenResponse = await Promise.all(
    screens.map((screen: any) =>
      limit(async () => {
        // Upload original image
        const res = await fetch(screen.src);
        if (!res.ok) {
          toast.error("Failed to fetch screen image.");
          return {
            ok: false,
            message: "Failed to fetch screen image.",
          };
        }
        if (
          data.redactions[screen.id] &&
          data.redactions[screen.id].length > 0
        ) {
          // Process redacted image
          const dataURL = await exportRedactedImage(
            data.redactions[screen.id],
            screen.src
          );
          if (!dataURL) {
            toast.error("Failed to export redacted image.");
            return {
              ok: false,
              message: "Failed to export redacted image.",
            };
          }
          // Create a new file from the data URL
          const byteString = atob(dataURL.split(",")[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const file = new File([ab], `${screen.id}.png`, {
            type: "image/png",
          });

          const prefix = `traces/${trace.id}/screens`;
          const fileName = `${screen.id}.png`;
          const uploadRes = await uploadToS3(file, prefix, fileName, file.type);
          if (!uploadRes.ok) {
            toast.error("Failed to upload redacted image.");
            return {
              ok: false,
              message: "Failed to upload redacted image.",
            };
          }
          // Set screen src to redacted S3 URL
          screens.find((s: any) => s.id === screen.id)!.src =
            uploadRes.data.fileUrl;
          return uploadRes;
        } else {
          const blob = await res.blob();
          const file = new File([blob], `${screen.id}.png`, {
            type: "image/png",
          });
          const prefix = `traces/${trace.id}/screens`;
          const fileName = `${screen.id}.png`;
          const uploadRes = await uploadToS3(file, prefix, fileName, file.type);
          if (!uploadRes || !uploadRes.ok) {
            toast.error("Failed to upload screen image.");
            return {
              ok: false,
              message: "Failed to upload screen image.",
            };
          }
          // Set screen src to original S3 URL
          screens.find((s: any) => s.id === screen.id)!.src =
            uploadRes.data.fileUrl;
          return uploadRes;
        }
      })
    )
  );
  if (!uploadScreenResponse || uploadScreenResponse.some((res) => !res.ok)) {
    toast.error(
      uploadScreenResponse.find((res) => !res.ok)?.message ??
        "Failed to upload screen images."
    );
    return Promise.reject(
      uploadScreenResponse.find((res) => !res.ok)?.message ??
        "Failed to upload screen images."
    );
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
    // upload view hierarchies to s3
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

          const redactions = data.redactions[screen.id];
          if (redactions) {
            redactVH(vh, redactions, imgWidth, imgHeight);
          }
          if (!vh) {
            return { ok: false, message: "Failed to find view hierarchies." };
          }

          // upload view hierarchies to s3
          const blob = new Blob([JSON.stringify(vh, null, 2)], {
            type: "application/json",
          });
          const file = new File([blob], `${screen.id}.json`, {
            type: "application/json",
          });
          const prefix = `traces/${trace.id}/vhs`;
          const fileName = `${screen.id}.json`;
          const uploadRes = await uploadToS3(file, prefix, fileName, file.type);
          if (!uploadRes.ok) {
            toast.error("Failed to upload view hierarchies.");
            return {
              ok: false,
              message: "Failed to upload view hierarchies.",
            };
          }
          screens[index].vh = uploadRes.data.fileUrl;
          return uploadRes;
        })
      )
    );
    if (!vhUploadRes || vhUploadRes.some((res) => !res!.ok)) {
      toast.error(
        vhUploadRes.find((res) => !res!.ok)?.message ??
          "Failed to upload screen view hierarchies."
      );
      return Promise.reject(
        vhUploadRes.find((res) => !res!.ok)?.message ??
          "Failed to upload screen view hierarchies."
      );
    }
  }
  // update trace with screens and view hierarchies
  const updateTraceRes = await updateTrace(
    trace.id,
    {
      screens: {
        create: screens,
      },
    },
    {
      includes: {
        screens: true,
      },
    }
  );
  if (!updateTraceRes.ok) {
    toast.error(updateTraceRes.message ?? "Failed to update trace.");
    return Promise.reject(updateTraceRes.message ?? "Failed to update trace.");
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
