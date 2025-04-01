"use client";

import React, { Dispatch, SetStateAction, useRef } from "react";
import { Button } from "@/components/ui/button";
import FrameGallery from "./extract-frames-gallery";
import useSWR from "swr";
import { getUploadedCaptureFiles } from "@/lib/actions";
import { toast } from "sonner";

export type FrameData = {
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

const ExtractFrames = ({
  capture,
  frames,
  setFrames,
}: {
  capture: any;
  frames: FrameData[];
  setFrames: Dispatch<SetStateAction<FrameData[]>>;
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { data: captures = [], isLoading: isCapturesLoading } = useSWR(
    capture.id ? ["", capture.id] : null,
    fileFetcher,
    {
      refreshInterval: 10,
    }
  );

  /**
   * Extracts frame from the video at current timestamp
   * @param video HTML object of video element to extract from
   */
  function extractVideoFrame(video: HTMLVideoElement): Promise<FrameData> {
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
  }

  function storeFrame(
    video: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    time: number,
    resolve: (frame: FrameData) => void
  ) {
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    resolve({
      url: canvas.toDataURL(),
      timestamp: time,
    });
  }

  return (
    <div className="w-full h-[calc(100dvh-var(--nav-height))]">
      {!isCapturesLoading && captures.length > 0 ? (
        <div className="flex flex-col justify-start items-center">
          <video
            crossOrigin="anonymous"
            className="relative top-50 mb-8 md:mb-12"
            controls
            width={220}
            height={480}
            ref={videoRef}
          >
            <source src={captures[0].fileUrl} type="video/mp4" />
          </video>
          <Button
            className="sticky top-178"
            onClick={async () => {
              if (videoRef.current !== null) {
                const frame = await extractVideoFrame(videoRef.current);
                setFrames((prev) =>
                  [...prev, frame].sort((a, b) => a.timestamp - b.timestamp)
                );
              }
            }}
          >
            Extract Frame
          </Button>
        </div>
      ) : (
        <></>
      )}
      {(frames.length > 0 || videoRef.current != null) && (
        <FrameGallery
          frameData={frames}
          setFrameData={setFrames}
          video={videoRef.current}
        />
      )}
    </div>
  );
};

export default ExtractFrames;
