"use client";

import React, { useRef, useState, useEffect } from "react";
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
  const res = await getUploadedCaptureFiles(captureId);
  if (res.ok) return res.data;
  console.error("Failed to fetch uploaded files", res.message);
  toast.error("Failed to fetch uploaded files");
  return [];
}

export default function ExtractFrames({ capture }: { capture: any }) {
  const { setValue, watch } = useFormContext<TraceFormData>();
  const frames = watch("screens") as FrameData[];

  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnails, setThumbnails] = useState<FrameData[]>([]);

  const { data: captures = [], isLoading } = useSWR(
    capture.id ? ["", capture.id] : null,
    fileFetcher
  );

  // Smooth playhead updates
  useEffect(() => {
    let raf: number;
    function tick() {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
        raf = requestAnimationFrame(tick);
      }
    }
    if (isPlaying) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  // Extract a single frame at time t
  const extractVideoFrame = (
    video: HTMLVideoElement,
    t: number
  ): Promise<FrameData> =>
    new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("canvas error");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const store = () => {
        ctx.drawImage(video, 0, 0);
        resolve({ id: `${t}-${Math.random()}`, url: canvas.toDataURL(), timestamp: t });
      };

      if (Math.abs(video.currentTime - t) < 0.1) {
        store();
      } else {
        if (video.ended || video.currentTime >= video.duration) video.pause();
        video.addEventListener("seeked", function onSeek() {
          video.removeEventListener("seeked", onSeek);
          store();
        });
        video.currentTime = t;
      }
    });

  // “Capture frame” button
  const handleCaptureFrame = async () => {
    if (!videoRef.current) return;
    const f = await extractVideoFrame(videoRef.current, currentTime);
    setValue("screens", [...frames, f].sort((a, b) => a.timestamp - b.timestamp));
  };

  // generate 3 thumbnails per second (no minimum)
  const onLoadedMetadata = async (
    e: React.SyntheticEvent<HTMLVideoElement>
  ) => {
    const vid = e.currentTarget;
    setVideoDuration(vid.duration);

    const count = Math.ceil(vid.duration * 3);
    const step = vid.duration / (count - 1);

    const clone = document.createElement("video");
    clone.crossOrigin = "anonymous";
    clone.src = vid.currentSrc;
    await new Promise<void>((r) => (clone.onloadedmetadata = () => r()));

    const thumbs: FrameData[] = [];
    for (let i = 1; i < count; i++) {
      thumbs.push(await extractVideoFrame(clone, step * i));
    }
    setThumbnails(thumbs);
  };

  const handleSetTime = (t: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = t;
    if (videoRef.current.ended || t === videoDuration) videoRef.current.pause();
    setCurrentTime(t);
  };

  // Play/Pause toggle
  const handlePlayPause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.paused ? vid.play() : vid.pause();
  };

  return (
    <div className="flex flex-col w-full h-[calc(100dvh-var(--nav-height))]">
      {/* Video Frame Gallery */}
      <div className="flex-1 w-full h-0 min-h-0 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={33} minSize={25} maxSize={50}>
            <div className="flex justify-center items-center h-full p-6 bg-neutral-50 dark:bg-neutral-950">
              {isLoading ? (
                <div className="animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg aspect-[1/2] w-full h-full" />
              ) : (
                <video
                  crossOrigin="anonymous"
                  ref={videoRef}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={onLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="rounded-lg max-w-full max-h-[calc(100%-4rem)] mb-4"
                >
                  <source src={captures[0]?.fileUrl} type="video/mp4" />
                </video>
              )}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={67}>
            <FrameGallery frames={frames} setTime={handleSetTime} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Filmstrip Timeline */}
      <FrameTimeline
        thumbnails={thumbnails}
        currentTime={currentTime}
        videoDuration={videoDuration}
        isPlaying={isPlaying}
        onSetTime={handleSetTime}
        onPlayPause={handlePlayPause}
        onCapture={handleCaptureFrame}
      />
    </div>
  );
}
