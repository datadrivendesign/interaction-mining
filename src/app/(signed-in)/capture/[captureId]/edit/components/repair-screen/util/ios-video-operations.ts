import { FrameData } from "../../types";
import { ListedFiles } from "@/lib/actions";

type ExtractedImageMimeType = "image/png" | "image/jpeg";

type ExtractVideoFrameOptions = {
  scale?: number;
  mimeType?: ExtractedImageMimeType;
  quality?: number;
  output?: "data-url" | "object-url";
  preferOffscreenCanvas?: boolean;
};

type FrameCanvas = HTMLCanvasElement | OffscreenCanvas;

const DEFAULT_EXTRACT_OPTIONS: Required<ExtractVideoFrameOptions> = {
  scale: 1,
  mimeType: "image/png",
  quality: 0.92,
  output: "data-url",
  preferOffscreenCanvas: false,
};

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

/**
 * How long to wait for a seek to report back before drawing anyway.
 *
 * Asking for the position the element already holds may complete without firing
 * `seeked` at all, and an unbounded wait there hangs the caller for good —
 * capturing at the current playhead is exactly that case. Falling through is safe
 * precisely when it happens, because the frame on the element is already the one
 * being asked for.
 *
 * Deliberately a deadline rather than a `video.seeking` check. Skipping the wait
 * whenever `seeking` reads false would draw before the frame arrives on any engine
 * that sets the flag asynchronously, which trades a hang for a wrong frame — the
 * far worse of the two, and the failure this whole area has already been bitten by.
 */
const SEEK_SETTLE_TIMEOUT_MS = 500;

/** Deadline for a thumbnail element to report metadata before giving up on it. */
const THUMBNAIL_VIDEO_LOAD_TIMEOUT_MS = 20000;

const seekVideoToTime = async (video: HTMLVideoElement, t: number) => {
  await new Promise<void>((resolve, reject) => {
    let timeout: number | null = null;
    const cleanup = () => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
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
    timeout = window.setTimeout(() => {
      cleanup();
      resolve();
    }, SEEK_SETTLE_TIMEOUT_MS);
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = t;
  });
};

/**
 * One read at a time per element.
 *
 * Two overlapping seeks on one element resolve on each other's `seeked` and leave
 * the decoder where neither caller asked, so the loser draws the winner's frame.
 * `extractVideoThumbnails` has always known this — "parallel messes up seeking" —
 * and runs its own loop sequentially, but the displayed element is read by three
 * callers that cannot see one another: `c` captures, the bootstrap screen pass,
 * and the scrub queue moving the playhead underneath both.
 *
 * Keyed per element rather than globally, so a capture does not have to queue
 * behind ninety thumbnail extractions on a different element.
 */
const readQueues = new WeakMap<HTMLVideoElement, Promise<unknown>>();

const enqueueRead = <T,>(
  video: HTMLVideoElement,
  operation: () => Promise<T>
): Promise<T> => {
  const previous = readQueues.get(video) ?? Promise.resolve();
  const run = previous.then(operation, operation);
  // Swallowed for the chain's benefit only: a failed read must not block the
  // reads behind it. The caller still sees the rejection through `run`.
  readQueues.set(
    video,
    run.catch(() => undefined)
  );
  return run;
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
  return enqueueRead(video, () => grabFrameViaCanvas(video, t, options));
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
    // Rejects rather than waiting forever. With no error path and no deadline
    // this promise could simply never settle — an element that never gets
    // metadata never fires the event — and the caller was left with an empty
    // thumbnail grid, no toast, and nothing in the console. A scrub with no
    // preview and no badge is what that looks like from the outside, and it had
    // to be diagnosed from behaviour because nothing reported it.
    await new Promise<void>((resolve, reject) => {
      let timeout: number | null = null;
      const cleanup = () => {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        thumbVideo.removeEventListener("loadedmetadata", onLoaded);
        thumbVideo.removeEventListener("error", onError);
      };
      const onLoaded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("Thumbnail video failed to load"));
      };
      timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("Thumbnail video load timed out"));
      }, THUMBNAIL_VIDEO_LOAD_TIMEOUT_MS);
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
    // Releases the element's hold on the resource. Whether a detached media
    // element with a loaded source is collected promptly is engine-dependent, so
    // this is hygiene rather than a measured fix — but browsers do cap how many
    // videos they decode at once, and two of these were created per bootstrap
    // and never let go.
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
