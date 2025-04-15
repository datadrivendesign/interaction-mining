"use client";

import React, { useRef, useState } from "react";
import useSWR from "swr";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import FrameGallery from "./extract-frames-gallery";
import FrameTimeline from "./extract-frames-timeline";
import { TraceFormData } from "../../page";

import { getUploadedCaptureFiles } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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
  const { setValue, watch } = useFormContext<TraceFormData>();
  const frames = watch("screens") as FrameData[];

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // State for video playback tracking
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch file data using SWR.
  const { data: captures = [], isLoading: isCapturesLoading } = useSWR(
    capture.id ? ["", capture.id] : null,
    fileFetcher
  );

  // When capturing a frame, use the state’s currentTime as the target snapshot time
  const handleCaptureFrame = async () => {
    if (videoRef.current !== null) {
      const snapshotTime = currentTime;
      const frame = await extractVideoFrame(videoRef.current, snapshotTime);
      setValue(
        "screens",
        [...frames, frame].sort((a, b) => a.timestamp - b.timestamp)
      );
    }
  };

  const extractVideoFrame = (
    video: HTMLVideoElement,
    snapshotTime: number
  ): Promise<FrameData> => {
    return new Promise((resolve, reject) => {
      const canvas: HTMLCanvasElement = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        console.error("HTML canvas could not get 2d context");
        reject("canvas creation error");
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // If the video is already near the target time, capture immediately
      if (Math.abs(video.currentTime - snapshotTime) < 0.1) {
        storeFrame(video, context, canvas, snapshotTime, resolve);
      } else {
        // If the video is ended, force a pause so that seeking works correctly.
        if (video.ended || video.currentTime >= video.duration) {
          video.pause();
        }
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          storeFrame(video, context, canvas, snapshotTime, resolve);
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = snapshotTime;
      }
    });
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

  // Whenever the user scrubs or clicks, update both the video element and the local state
  // Force a pause if the video had ended
  const handleSetTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      if (videoRef.current.ended || videoRef.current.currentTime === videoDuration) {
        videoRef.current.pause();
      }
      setCurrentTime(time);
    }
  };

  return (
    <div className="flex flex-col w-full h-[calc(100dvh-var(--nav-height))]">
      {/* Video + Gallery Section */}
      <div className="flex-1 w-full h-0 min-h-0 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={33} minSize={25} maxSize={50}>
            <div className="flex flex-col grow justify-center items-center h-full max-h-full p-6 bg-neutral-50 dark:bg-neutral-950">
              {isCapturesLoading ? (
                <div className="max-w-full max-h-[calc(100%-4rem)] bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-lg aspect-[1/2]" />
              ) : (
                // Inline event handlers keep our state in sync
                <video
                  crossOrigin="anonymous"
                  ref={videoRef}
                  onTimeUpdate={(e) =>
                    setCurrentTime(e.currentTarget.currentTime)
                  }
                  onLoadedMetadata={(e) =>
                    setVideoDuration(e.currentTarget.duration)
                  }
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="z-0 max-w-full max-h-[calc(100%-4rem)] mb-4 rounded-lg"
                >
                  <source src={captures[0].fileUrl} type="video/mp4" />
                </video>
              )}
              <Button onClick={handleCaptureFrame}>
                <Camera className="mr-2" />
                Snapshot
              </Button>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={67}>
            <div className="flex w-full h-full overflow-auto">
              <FrameGallery frames={frames} setTime={handleSetTime} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Timeline Section */}
      <FrameTimeline
        frames={frames}
        currentTime={currentTime}
        videoDuration={videoDuration}
        isPlaying={isPlaying}
        onSetTime={handleSetTime}
        onPlayPause={() => {
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play();
            } else {
              videoRef.current.pause();
            }
          }
        }}
        onBackward={() => {
          if (videoRef.current) {
            const newTime = Math.max(videoRef.current.currentTime - 2, 0);
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
          }
        }}
        onForward={() => {
          if (videoRef.current) {
            const newTime = videoRef.current.currentTime + 2;
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
          }
        }}
        onCapture={handleCaptureFrame}
      />
    </div>
  );
}
