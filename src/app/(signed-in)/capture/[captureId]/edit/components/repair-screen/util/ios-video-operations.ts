import { FrameData } from "../../types";
import { ListedFiles } from "@/lib/actions";

type ExtractedImageMimeType = "image/png" | "image/jpeg";

export type ExtractVideoFrameOptions = {
  scale?: number;
  mimeType?: ExtractedImageMimeType;
  quality?: number;
  output?: "data-url" | "object-url";
  preferOffscreenCanvas?: boolean;
  /**
   * Wait for a paint between the seek landing and the pixels being sampled.
   *
   * `seeked` reports that the playback position moved, not that the decoded
   * picture has reached the surface canvas reads; sampling in that gap returns
   * the previous frame carrying the new timestamp. Off by default because
   * bootstrap extracts dozens of thumbnails in a loop and they are correct
   * without it — worth the two frames only for reads a worker will look at.
   */
  waitForPaint?: boolean;
};

type FrameCanvas = HTMLCanvasElement | OffscreenCanvas;

const DEFAULT_EXTRACT_OPTIONS: Required<ExtractVideoFrameOptions> = {
  scale: 1,
  mimeType: "image/png",
  quality: 0.92,
  output: "data-url",
  preferOffscreenCanvas: false,
  waitForPaint: false,
};

/** Deadline for a thumbnail element to report metadata before giving up on it. */
const THUMBNAIL_VIDEO_LOAD_TIMEOUT_MS = 20000;

/** Resolves once the browser has composited, not merely scheduled, a frame. */
const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

const resolveExtractOptions = (
  scaleOrOptions?: number | ExtractVideoFrameOptions,
  overrideOptions?: ExtractVideoFrameOptions
): Required<ExtractVideoFrameOptions> => {
  if (typeof scaleOrOptions === "number") {
    return {
      ...DEFAULT_EXTRACT_OPTIONS,
      scale: scaleOrOptions,
      ...overrideOptions,
    };
  }

  return {
    ...DEFAULT_EXTRACT_OPTIONS,
    ...scaleOrOptions,
  };
};

const seekVideoToTime = async (video: HTMLVideoElement, t: number) => {
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = (e: Event) => {
      cleanup();
      reject(e);
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = t;
    // Assigning a position the element already holds can finish without ever
    // starting a seek, and then no `seeked` is coming. `seeking` is set
    // synchronously by the seek algorithm, so its still being false here means
    // there is nothing to wait for — waiting anyway hangs the caller, and this
    // is the common case for capturing at the current playhead.
    if (!video.seeking) {
      cleanup();
      resolve();
    }
  });
};

const drawFrameToCanvas = (
  video: HTMLVideoElement,
  scale: number,
  preferOffscreenCanvas: boolean
): FrameCanvas => {
  const cw = Math.floor(video.videoWidth * scale);
  const ch = Math.floor(video.videoHeight * scale);

  if (preferOffscreenCanvas && typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(cw, ch);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("OffscreenCanvas2D not supported");
    }
    ctx.drawImage(video, 0, 0, cw, ch);
    return canvas;
  }

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas2D not supported");
  }
  ctx.drawImage(video, 0, 0, cw, ch);
  return canvas;
};

const canvasToBlob = async (
  canvas: FrameCanvas,
  mimeType: ExtractedImageMimeType,
  quality: number
) => {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({
      type: mimeType,
      quality: mimeType === "image/jpeg" ? quality : undefined,
    });
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to convert canvas to blob"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      mimeType === "image/jpeg" ? quality : undefined
    );
  });
};

const blobToDataUrl = async (blob: Blob) =>
  await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to convert blob to data URL"));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read blob"));
    };
    reader.readAsDataURL(blob);
  });

/**
 * Fallback frame grabber using Canvas2D (works in Safari) to extract a frame from a video
 * @param video - The HTML video element to extract frames from
 * @param t - The timestamp to extract the frame from
 * @param options - The extraction options
 * @returns The frame data (id, src, timestamp)
 */
async function grabFrameViaCanvas(
  video: HTMLVideoElement,
  t: number,
  options: Required<ExtractVideoFrameOptions>
): Promise<FrameData> {
  await seekVideoToTime(video, t);
  if (options.waitForPaint) {
    await waitForPaint();
  }
  const canvas = drawFrameToCanvas(
    video,
    options.scale,
    options.output === "object-url" && options.preferOffscreenCanvas
  );
  const blob = await canvasToBlob(canvas, options.mimeType, options.quality);
  const src =
    options.output === "object-url"
      ? URL.createObjectURL(blob)
      : await blobToDataUrl(blob);

  return {
    id: `${t}-${Math.random()}`,
    src,
    timestamp: t,
  };
}

/**
 * Extracts frame from the video at current timestamp using WebCodecs API
 * @param video - The HTML video element to extract frames from
 * @param t - The timestamp to extract the frame from
 * @param scale - The scale of the frame (default is 1)
 * @returns The frame data (id, src, timestamp)
 */
export async function extractVideoFrame(
  video: HTMLVideoElement,
  t: number,
  scaleOrOptions?: number | ExtractVideoFrameOptions,
  overrideOptions?: ExtractVideoFrameOptions
): Promise<FrameData> {
  const options = resolveExtractOptions(scaleOrOptions, overrideOptions);
  return grabFrameViaCanvas(video, t, options);
}

/**
 * Extracts thumbnails from the video
 * @param video - The video element to extract thumbnails from
 * @param videoDuration - The duration of the video
 * @param maxThumbs - The maximum number of thumbnails to extract
 * @param thumbHeight - The height of the thumbnails
 * @returns The list of thumbnails
 */
export async function extractVideoThumbnails(
  video: HTMLVideoElement,
  videoDuration: number,
  maxThumbs: number = 30,
  thumbHeight: number = 128,
  options?: ExtractVideoFrameOptions
): Promise<ListedFiles[]> {
  const thumbVideo = document.createElement("video");
  thumbVideo.crossOrigin = "anonymous";
  thumbVideo.preload = "metadata";
  thumbVideo.src = video.currentSrc || video.src;
  try {
    // Rejects rather than waits forever. Without an error path or a deadline
    // this promise could never settle — a browser that will not give this
    // element a decoder simply never fires `loadedmetadata` — and the caller
    // was left with an empty thumbnail grid and no indication why. That is what
    // a scrub with no preview and no badge looks like.
    await new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        clearTimeout(timeout);
        thumbVideo.removeEventListener("loadedmetadata", onLoaded);
        thumbVideo.removeEventListener("error", onError);
        if (error) {
          reject(error);
          return;
        }
        resolve();
      };
      const onLoaded = () => finish();
      const onError = () =>
        finish(new Error("Thumbnail video failed to load"));
      const timeout = setTimeout(
        () => finish(new Error("Thumbnail video load timed out")),
        THUMBNAIL_VIDEO_LOAD_TIMEOUT_MS
      );
      thumbVideo.addEventListener("loadedmetadata", onLoaded, { once: true });
      thumbVideo.addEventListener("error", onError, { once: true });
    });
    return await extractThumbnailsFrom(
      thumbVideo,
      video,
      videoDuration,
      maxThumbs,
      thumbHeight,
      options
    );
  } finally {
    // Releases the decoder. Left attached to a source, every call leaked a live
    // media element for the rest of the session — two per bootstrap — and
    // browsers cap how many they will decode at once.
    thumbVideo.removeAttribute("src");
    thumbVideo.load();
  }
}

async function extractThumbnailsFrom(
  thumbVideo: HTMLVideoElement,
  video: HTMLVideoElement,
  videoDuration: number,
  maxThumbs: number,
  thumbHeight: number,
  options?: ExtractVideoFrameOptions
): Promise<ListedFiles[]> {
  // determine how many thumbnails to extract
  const duration = videoDuration;
  const fps = 60;
  // extract maxThumbs thumbnails or every two frames, whichever is smaller
  const thumbnailCount = Math.min(Math.floor(duration * fps) / 2, maxThumbs);
  const scale = Math.min(1, thumbHeight / thumbVideo.videoHeight);
  // need to do sequentially, parallel messes up seeking
  const thumbsRes: FrameData[] = [];
  // Before the loop, do a "warm-up" seek to ensure video is loaded:
  const warmupFrame = await extractVideoFrame(thumbVideo, 0.1, {
    ...options,
    scale,
  });
  if (warmupFrame.src.startsWith("blob:")) {
    URL.revokeObjectURL(warmupFrame.src);
  }
  for (let i = 0; i < thumbnailCount; i++) {
    const t = (videoDuration / thumbnailCount) * i;
    const frame = await extractVideoFrame(thumbVideo, t, {
      ...options,
      scale,
    });
    thumbsRes.push(frame);
  }
  return thumbsRes.map((f, index) => ({
    fileKey: "thumbs/",
    fileName: `frame-${index}.${options?.mimeType === "image/jpeg" ? "jpg" : "png"}`,
    fileUrl: f.src!,
  }));
}

/**
 * Extracts thumbnails from the video
 * @param video - The video element to extract thumbnails from
 * @param videoDuration - The duration of the video
 * @param maxThumbs - The maximum number of thumbnails to extract
 * @param thumbHeight - The height of the thumbnails
 * @returns The list of thumbnails
 */
export const extractThumbnails = async (
  video: HTMLVideoElement,
  videoDuration: number,
  maxThumbs: number = 30,
  thumbHeight: number = 128,
  options?: ExtractVideoFrameOptions
) => {
  const thumbnailFiles = await extractVideoThumbnails(
    video,
    videoDuration,
    maxThumbs,
    thumbHeight,
    options
  );
  const thumbs = thumbnailFiles.map((f, index) => ({
    src: f.fileUrl,
    timestamp: (videoDuration / thumbnailFiles.length) * index,
    width: video.videoWidth,
    height: video.videoHeight,
  }));
  return thumbs;
};
