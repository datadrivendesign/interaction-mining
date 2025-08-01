import { toast } from "sonner";
import { FrameData } from "../../types";
import { generateSignedCloudFrontURL, listFromS3 } from "@/lib/aws/s3/server";
import { ListedFiles } from "@/lib/actions";
import { mutate, SWRConfiguration, SWRResponse } from "swr";
import { isCloudfrontUrlExpired } from "@/lib/aws";
import { Variants } from "motion/react";

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

export const card = {
  initial: {
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
} as Variants;

export const getSWRConfig = (
  captureId: string
): SWRConfiguration<ListedFiles[]> => ({
  refreshInterval: 5000,
  compare: (prevFiles, currFiles) => {
    if (!prevFiles || !currFiles) {
      // if one is undefined and the other is not, return false
      if (!prevFiles && currFiles) {
        return false;
      }
      if (prevFiles && !currFiles) {
        return false;
      }
      return true;
    }
    // if both are defined, check if the file keys are the same
    if (prevFiles.length !== currFiles.length) {
      return false;
    }
    // check if file keys are the same
    const prevFileKeys = prevFiles.map((file) => file.fileKey);
    const currFileKeys = currFiles.map((file) => file.fileKey);
    if (prevFileKeys.every((key, index) => key === currFileKeys[index])) {
      // check if any file urls are expired
      if (prevFiles.some((file) => isCloudfrontUrlExpired(file.fileUrl))) {
        return false;
      }
      return true;
    }
    return false;
  },
});
