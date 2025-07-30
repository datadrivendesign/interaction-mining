import { toast } from "sonner";
import { FrameData } from "../../types";
import { listFromS3 } from "@/lib/aws/s3/server";
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
  // Always use Canvas2D fallback for frame extraction
  return grabFrameViaCanvas(video, t, scale);
}

export async function fileFetcher([_, fileKey]: [string, string]) {
  let res = await listFromS3(fileKey);

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch uploaded files", res.message);
    toast.error("Failed to fetch uploaded files");
    return [];
  }
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
  onSuccess: (data: ListedFiles[]) => {
    if (
      captureId &&
      data &&
      data.some((file: ListedFiles) => isCloudfrontUrlExpired(file.fileUrl))
    ) {
      console.log("Detected expired URLs, forcing revalidation");
      mutate(["Capture files", `processed/${captureId}`]);
    }
  },
});