"use client";

import React, { useRef } from "react";
import useSWR from "swr";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import FrameGallery from "./extract-frames-gallery";
import { CaptureFormData } from "../../page";

import { getUploadedCaptureFiles } from "@/lib/actions";
import { Button } from "@/components/ui/button";

export type FrameData = {
  id: string;
  url: string;
  timestamp: number;
};

export async function fileFetcher([_, captureId]: [string, string]) {
  let res = await getUploadedCaptureFiles(captureId);

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch uploaded files", res.message);
    toast.error("Failed to fetch uploaded files");
    return [];
  }
}

export default function ExtractFrames({ capture }: { capture: any }) {
  const { setValue, watch } = useFormContext<CaptureFormData>();
  const frames = watch("screens") as FrameData[];

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch file data
  const { data: captures = [], isLoading: isCapturesLoading } = useSWR(
    capture.id ? ["", capture.id] : null,
    fileFetcher
  );

  const handleCaptureFrame = async () => {
    if (videoRef.current !== null) {
      const frame = await extractVideoFrame(videoRef.current);

      setValue(
        "screens",
        [...frames, frame].sort((a, b) => a.timestamp - b.timestamp)
      );
    }
  };

  /**
   * Extracts frame from the video at current timestamp
   * @param video HTML object of video element to extract from
   */
  const extractVideoFrame = (video: HTMLVideoElement): Promise<FrameData> => {
    return new Promise(
      async (
        resolve: (frame: FrameData) => void,
        reject: (error: string) => void
      ) => {
        let canvas: HTMLCanvasElement = document.createElement("canvas");
        let context: CanvasRenderingContext2D | null = canvas.getContext("2d");
        if (context === null) {
          console.error("HTML canvas could not get 2d context");
          reject("canvas creation error");
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        let time = video.currentTime;

        let eventCallback = () => {
          video.removeEventListener("seeked", eventCallback);
          storeFrame(video, context, canvas, time, resolve);
        };
        video.addEventListener("seeked", eventCallback);
        video.currentTime = time;
      }
    );
  };

  const storeFrame = (
    video: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    time: number,
    resolve: (frame: FrameData) => void
  ) => {
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    resolve({
      id: time.toString() + Math.random().toString(),
      url: canvas.toDataURL(),
      timestamp: time,
    });
  };

  const handleSetTime = (time: number) => {
    if (videoRef.current !== null) {
      videoRef.current.currentTime = time;
    }
  };

  return (
    <div className="flex flex-row w-full h-[calc(100dvh-var(--nav-height))] gap-4 p-8 pb-0">
      <div className="flex flex-col shrink-0 grow-0 justify-center items-center w-fit h-full mb-4">
        {isCapturesLoading ? (
          <div className="w-auto h-full bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-lg aspect-[1/2]"></div>
        ) : (
          <video
            crossOrigin="anonymous"
            className="z-0 object-cover w-auto h-full mb-4 rounded-lg"
            controls
            ref={videoRef}
          >
            <source src={captures[0].fileUrl} type="video/mp4" />
          </video>
        )}
        <Button onClick={handleCaptureFrame}>
          <Camera /> Snapshot
        </Button>
      </div>
      <div className="flex h-full overflow-auto">
        <FrameGallery frames={frames} setTime={handleSetTime} />
      </div>
    </div>
  );
}
