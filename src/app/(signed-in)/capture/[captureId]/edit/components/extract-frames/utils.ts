import { FrameData } from "../types";

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
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = t;
  });
  // Create a VideoFrame from the video element
  const vf = new VideoFrame(video);
  // Create an ImageBitmap with resizing
  const bitmap = await createImageBitmap(vf, {
    resizeWidth: Math.floor(vf.codedWidth * scale),
    resizeHeight: Math.floor(vf.codedHeight * scale),
  });
  // Draw onto canvas
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context error");
  ctx.drawImage(bitmap, 0, 0);
  // Cleanup
  vf.close();
  bitmap.close();
  // Restore original time (optional, UI unaffected by offscreen usage)
  // Return frame data
  return {
    id: `${t}-${Math.random()}`,
    src: canvas.toDataURL(),
    timestamp: t,
  };
}
