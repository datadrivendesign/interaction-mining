import { FrameData } from "../../types";
import { ListedFiles } from "@/lib/actions";

/**
 * Fallback frame grabber using Canvas2D (works in Safari) to extract a frame from a video
 * @param video - The HTML video element to extract frames from
 * @param t - The timestamp to extract the frame from
 * @param scale - The scale of the frame (default is 1)
 * @returns The frame data (id, src, timestamp)
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
  scale: number = 1
): Promise<FrameData> {
  // Always use Canvas2D fallback for frame extraction
  return grabFrameViaCanvas(video, t, scale);
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
  thumbHeight: number = 128
): Promise<ListedFiles[]> {
  const thumbVideo = document.createElement("video");
  thumbVideo.crossOrigin = "anonymous";
  thumbVideo.preload = "metadata";
  thumbVideo.src = video.src;
  await new Promise<void>((res) =>
    thumbVideo.addEventListener("loadedmetadata", () => res(), {
      once: true,
    })
  );
  // determine how many thumbnails to extract
  const duration = videoDuration;
  const fps = 60;
  // extract maxThumbs thumbnails or every two frames, whichever is smaller
  const thumbnailCount = Math.min(Math.floor(duration * fps) / 2, maxThumbs);
  const scale = thumbHeight / thumbVideo.videoHeight;
  // need to do sequentially, parallel messes up seeking
  const thumbsRes: FrameData[] = [];
  // Before the loop, do a "warm-up" seek to ensure video is loaded:
  await extractVideoFrame(thumbVideo, 0.1, scale);
  for (let i = 0; i < thumbnailCount; i++) {
    let t = (videoDuration / thumbnailCount) * i;
    const frame = await extractVideoFrame(thumbVideo, t, scale);
    thumbsRes.push(frame);
  }
  return thumbsRes.map((f, index) => ({
    fileKey: "thumbs/",
    fileName: `frame-${index}.png`,
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
  thumbHeight: number = 128
) => {
  const thumbnailFiles = await extractVideoThumbnails(
    video,
    videoDuration,
    maxThumbs,
    thumbHeight
  );
  const thumbs = thumbnailFiles.map((f, index) => ({
    src: f.fileUrl,
    timestamp: (videoDuration / thumbnailFiles.length) * index,
    width: video.videoWidth,
    height: video.videoHeight,
  }));
  return thumbs;
};
