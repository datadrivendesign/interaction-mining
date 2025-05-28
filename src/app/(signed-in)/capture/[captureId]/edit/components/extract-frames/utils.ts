import { FrameData } from "../types";

/**
 * Fallback frame grabber using Canvas2D (works in Safari).
 */
async function grabFrameViaCanvas(
  video: HTMLVideoElement,
  t: number,
  scale: number = 1
): Promise<FrameData> {
  // Seek to desired time
  await new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = (e: any) => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(e);
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = t;
  });

  // Draw the current frame into a Canvas
  const cw = Math.floor(video.videoWidth * scale);
  const ch = Math.floor(video.videoHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas2D not supported");
  ctx.drawImage(video, 0, 0, cw, ch);

  const dataUrl = canvas.toDataURL("image/png");
  return {
    id: `${t}-${Math.random()}`,
    src: dataUrl,
    timestamp: t,
  };
};

/**
 * Extracts frame from the video at current timestamp using WebCodecs API
 * @param video HTML object of video element to extract from
 */
export async function extractVideoFrame(
  video: HTMLVideoElement,
  t: number,
  scale: number = 1
): Promise<FrameData> {
  // Seek to desired time without affecting UI playback
  await new Promise<void>((res, rej) => {
    const onSeeked = () => {
      cleanup();
      res();
    };
    const onError = (e: any) => {
      cleanup();
      rej(e);
    };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };

    try {
      video.crossOrigin = "anonymous";
      video.addEventListener("seeked", onSeeked);
      video.currentTime = t;
    } catch (err) {
      console.warn("Frame extraction skipped (Safari canvas taint):", err);
      // Clean up listener and resolve a placeholder so nothing rejects
      video.removeEventListener("seeked", onSeeked);
      res();
    }
    video.currentTime = t;
  });

  try {
    const vf = new VideoFrame(video);
    const bitmap = await createImageBitmap(vf, {
      resizeWidth: Math.floor(vf.codedWidth * scale),
      resizeHeight: Math.floor(vf.codedHeight * scale),
    });
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context error");
    ctx.drawImage(bitmap, 0, 0);
    const src = canvas.toDataURL();
    vf.close();
    bitmap.close();
    return { id: `${t}-${Math.random()}`, src, timestamp: t };
  } catch (err) {
    console.warn("WebCodecs failed, falling back to Canvas2D:", err);
    return grabFrameViaCanvas(video, t, scale);
  }
}
