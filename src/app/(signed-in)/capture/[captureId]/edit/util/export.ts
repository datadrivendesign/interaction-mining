"use client";
import Konva from "konva";
import { toast } from "sonner";
import { Capture, Prisma, Trace } from "@prisma/client";
import plimit from "p-limit";

import { createTrace, ListedFiles, updateTrace } from "@/lib/actions";
import { uploadToS3 } from "@/lib/aws/s3/client";
import { UploadPurpose } from "@/lib/aws/s3/upload-purpose";

import {
  FrameData,
  TraceFormData,
  Redaction,
  DraftFrameData,
  DraftTraceFormData,
} from "../components/types";
import { redactVH } from "./vh-parse";
import { ActionPayload } from "@/lib/actions/types";

export enum DraftFetchResults {
  LOADING = "loading",
  SUCCESS = "success",
  NO_DRAFTS = "no_drafts",
  ERROR = "error",
}

// Draft listing moved to a checked server action; kept under its old name so
// the three callers (edit page, iOS and Android evaluate clients) are unchanged.
export { getCaptureDraftFiles as getDraftFiles } from "@/lib/actions/capture";

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
  const fileName = `draft-${Date.now()}.json`;
  const file = new File([JSON.stringify(draftTraceData)], fileName, {
    type: "application/json",
  });
  const uploadRes = await uploadToS3(
    file,
    UploadPurpose.CAPTURE_DRAFT,
    capture.id,
    fileName,
  );
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

/** One screen rendered for publishing: final PNG, and its VH if the capture has them. */
export type RenderedScreen = {
  screenId: string;
  png: File;
  vh: File | null;
};

/** Where a rendered screen's files ended up. */
type UploadedScreen = { src: string; vh: string };

type ScreenUploader = (
  rendered: RenderedScreen,
) => Promise<ActionPayload<UploadedScreen>>;

/**
 * Renders one screen for publishing: the frame with redactions burned in,
 * and its view hierarchy with redacted nodes blanked.
 *
 * VH rule (unchanged from the original export): if the capture has any VHs,
 * every screen must have one. iOS seeds an empty object per screen, so every
 * iOS screen gets an empty VH file; Android carries the real hierarchy.
 */
async function renderScreen(
  data: TraceFormData,
  screen: FrameData,
): Promise<ActionPayload<RenderedScreen>> {
  const fail = (message: string) => ({
    ok: false as const,
    message,
    data: null,
  });

  const res = await fetch(screen.src);
  if (!res.ok) {
    return fail("Failed to fetch screen image.");
  }

  let png: File;
  const redactions = data.redactions[screen.id] ?? [];
  if (redactions.length > 0) {
    const dataURL = await exportRedactedImage(redactions, screen.src);
    if (!dataURL) {
      return fail("Failed to export redacted image.");
    }
    const byteString = atob(dataURL.split(",")[1]);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    png = new File([bytes], `${screen.id}.png`, { type: "image/png" });
  } else {
    const blob = await res.blob();
    png = new File([blob], `${screen.id}.png`, { type: "image/png" });
  }

  let vhFile: File | null = null;
  const vhs = data.vhs;
  if (vhs && Object.keys(vhs).length > 0) {
    const source = vhs[screen.id];
    if (!source) {
      return fail("Failed to find view hierarchies.");
    }
    // Redact a copy: a failed Approve can be retried, and redacting the form
    // state in place would redact it twice and lose the original.
    const vh = structuredClone(source);
    if (redactions.length > 0) {
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
          image.onerror = () => reject(new Error("Failed to load image"));
          image.src = screen.src;
        });
        imgWidth = image.width;
        imgHeight = image.height;
      }
      redactVH(vh, redactions, imgWidth, imgHeight);
    }
    vhFile = new File([JSON.stringify(vh, null, 2)], `${screen.id}.json`, {
      type: "application/json",
    });
  }

  return {
    ok: true,
    message: "Screen rendered.",
    data: { screenId: screen.id, png, vh: vhFile },
  };
}

/**
 * Renders and uploads every screen, three at a time, rendering each just
 * before its upload so large traces never hold every PNG in memory at once.
 * Uploads retry on their own (`uploadToS3`). Stops reporting at the first
 * failure and returns it.
 *
 * @returns screen id → uploaded locations, in no particular order.
 */
async function renderAndUpload(
  data: TraceFormData,
  upload: ScreenUploader,
  onProgress?: (done: number, total: number) => void,
): Promise<ActionPayload<Map<string, UploadedScreen>>> {
  const limit = plimit(3);
  const total = data.screens.length;
  let done = 0;
  let failure: string | null = null;
  const uploaded = new Map<string, UploadedScreen>();
  onProgress?.(0, total);

  await Promise.all(
    data.screens.map((screen) =>
      limit(async () => {
        if (failure) return;
        try {
          const rendered = await renderScreen(data, screen);
          if (!rendered.ok) {
            failure ??= rendered.message;
            return;
          }
          const res = await upload(rendered.data);
          if (!res.ok) {
            failure ??= res.message;
            return;
          }
          uploaded.set(screen.id, res.data);
          done += 1;
          onProgress?.(done, total);
        } catch (err) {
          failure ??= err instanceof Error ? err.message : "Rendering failed.";
        }
      }),
    ),
  );

  if (failure) {
    return { ok: false, message: failure, data: null };
  }
  return { ok: true, message: "Screens uploaded.", data: uploaded };
}

/**
 * Admin approval: renders every screen from the loaded draft and builds the
 * public trace from the browser. Used for the final check on REVIEWED
 * captures and for approving REVIEWING captures directly. As before, the
 * trace row is created first (uploads need its id); a failed upload leaves
 * that row without screens.
 */
export async function handleTraceSave(
  data: TraceFormData,
  capture: Capture,
  onProgress?: (done: number, total: number) => void,
): Promise<ActionPayload<Trace>> {
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
  const traceId = traceRes.data.id;

  const uploadRes = await renderAndUpload(
    data,
    async ({ screenId, png, vh }) => {
      const pngRes = await uploadToS3(
        png,
        UploadPurpose.TRACE_SCREEN,
        traceId,
        `${screenId}.png`,
      );
      if (!pngRes.ok) {
        return {
          ok: false,
          message: "Failed to upload screen image.",
          data: null,
        };
      }
      let vhUrl = "";
      if (vh) {
        const vhRes = await uploadToS3(
          vh,
          UploadPurpose.TRACE_VH,
          traceId,
          `${screenId}.json`,
        );
        if (!vhRes.ok) {
          return {
            ok: false,
            message: "Failed to upload view hierarchies.",
            data: null,
          };
        }
        vhUrl = vhRes.data.fileUrl;
      }
      return {
        ok: true,
        message: "Uploaded.",
        data: { src: pngRes.data.fileUrl, vh: vhUrl },
      };
    },
    onProgress,
  );
  if (!uploadRes.ok) {
    toast.error(uploadRes.message);
    return { ok: false, message: uploadRes.message, data: null };
  }

  const screens = data.screens.map((screen) => {
    const files = uploadRes.data.get(screen.id)!;
    const gesture = data.gestures[screen.id] ?? {
      type: null,
      x: null,
      y: null,
      scrollDeltaX: null,
      scrollDeltaY: null,
      description: null,
    };
    return {
      src: files.src,
      vh: files.vh,
      created: new Date(),
      gesture,
      redactions: (data.redactions[screen.id] ?? []).map(
        ({ id: _id, ...redaction }) => redaction,
      ),
    };
  });

  const updateTraceRes = await updateTrace(
    traceId,
    { screens: { create: screens } },
    { includes: { screens: true } },
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
