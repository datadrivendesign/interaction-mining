import { toast } from "sonner";
import { FrameData } from "../../types";
import { generateSignedCloudFrontURL, listFromS3 } from "@/lib/aws/s3/server";
import { ListedFiles } from "@/lib/actions";
import { isCloudfrontUrlExpired } from "@/lib/aws";

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
}

/**
 * Extracts frame from the video at current timestamp using WebCodecs API
 * @param video HTML object of video element to extract from
 */
export async function extractVideoFrame(
  video: HTMLVideoElement,
  t: number,
  scale: number = 1
): Promise<FrameData> {
  // Always use Canvas2D fallback for frame extraction
  return grabFrameViaCanvas(video, t, scale);
}

export async function fileFetcher(
  [_, fileKey]: [string, string],
  cachedData?: ListedFiles[]
) {
  let res = await listFromS3(fileKey, false);
  if (!res.ok) {
    console.error("Failed to fetch uploaded files", res.message);
    toast.error("Failed to fetch uploaded files");
    return [];
  }
  // check if cached data matches current data and needs new signed url
  const processedData = await Promise.all(
    res.data.map(async (file) => {
      const cachedFile = cachedData?.find(
        (cached) => cached.fileKey === file.fileKey
      );
      // check if cached file is expired or not signed
      if (cachedFile && cachedFile.fileUrl.includes("?")) {
        const isExpired = isCloudfrontUrlExpired(cachedFile.fileUrl);
        if (!isExpired) {
          return { ...file, fileUrl: cachedFile.fileUrl };
        }
      }
      // Generate new signed URL
      const signedUrlRes = await generateSignedCloudFrontURL(file.fileKey);
      if (signedUrlRes.ok) {
        return { ...file, fileUrl: signedUrlRes.data.signedUrl };
      } else {
        return file;
      }
    })
  );
  return processedData;
}

// Load thumbnails
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
