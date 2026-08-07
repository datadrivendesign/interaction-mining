"use client";
import Konva from "konva";
import { toast } from "sonner";
import { Capture, Prisma, Trace } from "@prisma/client";
import plimit from "p-limit";

import { createTrace, ListedFiles, updateTrace } from "@/lib/actions";
import { uploadToS3 } from "@/lib/aws/s3/client";

import {
  FrameData,
  TraceFormData,
  Redaction,
  DraftFrameData,
  DraftTraceFormData,
} from "../components/types";
import { redactVH } from "./vh-parse";
import { listFromS3 } from "@/lib/aws/s3/server";
import { ActionPayload } from "@/lib/actions/types";

export enum DraftFetchResults {
  LOADING = "loading",
  SUCCESS = "success",
  NO_DRAFTS = "no_drafts",
  ERROR = "error",
}

export async function getDraftFiles(
  captureId: string,
): Promise<ActionPayload<ListedFiles[]>> {
  try {
    const files = await listFromS3(`uploads/${captureId}/drafts`, false);
    if (!files.ok) {
      return {
        ok: false,
        message: "Failed to fetch draft files.",
        data: null,
      };
    }
    return files;
  } catch (err) {
    console.error("Error fetching draft files:", err);
    return {
      ok: false,
      message: "Failed to fetch draft files.",
      data: null,
    };
  }
}

export async function getCaptureFiles(
  captureId: string,
): Promise<ActionPayload<ListedFiles[]>> {
  try {
    const files = await listFromS3(`uploads/${captureId}`, false);
    if (!files.ok) {
      return {
        ok: false,
        message: "Failed to fetch capture files.",
        data: null,
      };
    }
    const captureFiles = files.data.filter(
      (file) => !file.fileKey.includes(`${captureId}/drafts`),
    );
    return {
      ok: true,
      message: "Capture files fetched successfully.",
      data: captureFiles,
    };
  } catch (err) {
    console.error("Error fetching capture files:", err);
    return {
      ok: false,
      message: "Failed to fetch capture files.",
      data: null,
    };
  }
}

export async function handleDraftSave(
  data: TraceFormData,
  capture: Capture,
): Promise<ActionPayload<DraftTraceFormData>> {
  // grab screen data from trace form data to serialize
  const draftScreenData: DraftFrameData[] = data.screens.map(
    (screen: FrameData) => {
      return {
        id: screen.id,
        timestamp: screen.timestamp,
      };
    },
  );
  const draftTraceData: DraftTraceFormData = {
    screens: draftScreenData,
    gestures: data.gestures,
    redactions: data.redactions,
    description: data.description,
  };
  // add iOS and iPhone versions if they exist
  if (data.iPhoneVersion) {
    draftTraceData.iPhoneVersion = data.iPhoneVersion;
  }
  if (data.iOSVersion) {
    draftTraceData.iOSVersion = data.iOSVersion;
  }
  // upload draft trace data to s3
  const prefix = `uploads/${capture.id}/drafts`;
  const fileName = `draft-${Date.now()}.json`;
  const file = new File([JSON.stringify(draftTraceData)], fileName, {
    type: "application/json",
  });
  const uploadRes = await uploadToS3(file, prefix, fileName, file.type);
  if (!uploadRes.ok) {
    return {
      ok: false,
      message: "Failed to upload draft trace data.",
      data: null,
    };
  }
  return {
    ok: true,
    message: "Draft trace data uploaded successfully.",
    data: draftTraceData,
  };
}

export async function handleTraceSave(
  data: TraceFormData,
  capture: Capture,
): Promise<ActionPayload<Trace>> {
  // create a new trace without screens
  const traceInput: Prisma.TraceCreateWithoutUserInput = {
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
  };
  if (data.iOSVersion) {
    traceInput.iOSVersion = data.iOSVersion;
  }
  if (data.iPhoneVersion) {
    traceInput.iPhoneVersion = data.iPhoneVersion;
  }

  const traceRes = await createTrace(traceInput);
  if (!traceRes.ok) {
    return {
      ok: false,
      message: traceRes.message ?? "Failed to create trace.",
      data: null,
    };
  }
  const initTrace = traceRes.data;
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
            screen.src,
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

          const prefix = `traces/${initTrace.id}/screens`;
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
          const prefix = `traces/${initTrace.id}/screens`;
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
      }),
    ),
  );
  if (!uploadScreenResponse || uploadScreenResponse.some((res) => !res.ok)) {
    return {
      ok: false,
      message:
        uploadScreenResponse.find((res) => !res.ok)?.message ??
        "Failed to upload screen images.",
      data: null,
    };
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
              image.src = screen.src!;
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
          const prefix = `traces/${initTrace.id}/vhs`;
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
        }),
      ),
    );
    if (!vhUploadRes || vhUploadRes.some((res) => !res!.ok)) {
      return {
        ok: false,
        message:
          vhUploadRes.find((res) => !res!.ok)?.message ??
          "Failed to upload screen view hierarchies.",
        data: null,
      };
    }
  }
  // update trace with screens and view hierarchies
  const updateTraceRes = await updateTrace(
    initTrace.id,
    {
      screens: {
        create: screens,
      },
    },
    {
      includes: {
        screens: true,
      },
    },
  );
  if (!updateTraceRes.ok) {
    return {
      ok: false,
      message: updateTraceRes.message ?? "Failed to update trace.",
      data: null,
    };
  }

  return {
    ok: true,
    message: "Trace created successfully. Redirecting...",
    data: updateTraceRes.data,
  };
}

async function exportRedactedImage(redactions: Redaction[], image_src: string) {
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
