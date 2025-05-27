"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Camera,
  RotateCcw,
  RotateCw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { FrameData } from "../types";
import Image from "next/image";
import { extractVideoFrame } from "./utils";
import useMeasure from "@/lib/hooks/useMeasure";
import { Button } from "@/components/ui/button";
import Kbd from "@/components/ui/kbd";

export type FrameTimelineProps = {
  src: string;
  currentTime: number;
  videoDuration: number;
  isPlaying: boolean;
  handleSetTime: (t: number) => void;
  handlePlayPause: () => void;
  handleCapture: () => void;
};

export default function FrameTimeline({
  src,
  currentTime,
  videoDuration,
  isPlaying,
  handleSetTime,
  handlePlayPause,
  handleCapture,
}: FrameTimelineProps) {
  const [timelineRef, timelineMeasure] = useMeasure<HTMLDivElement>();
  const [dragging, setDragging] = useState(false);
  const [thumbnailsState, setThumbnails] = useState<FrameData[]>([]);

  // Map pointer X -> video time
  const getTimeFromEvent = (e: MouseEvent | React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    return pct * videoDuration;
  };

  // Start scrub on pointer down
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    timelineRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    const t = getTimeFromEvent(e);
    if (t !== undefined) handleSetTime(t);
  };

  // Scrub on pointer move when dragging
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const t = getTimeFromEvent(e);
    if (t !== undefined) handleSetTime(t);
  };

  // End scrub on pointer up
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    timelineRef.current?.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(currentTime + 5, videoDuration);
    handleSetTime(newTime);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(currentTime - 5, 0);
    handleSetTime(newTime);
  };

  // Load thumbnails
  const onLoadedMetadata = useCallback(
    async (videoUrl: string) => {
      const thumbVideo = document.createElement("video");
      thumbVideo.crossOrigin = "anonymous";
      thumbVideo.preload = "metadata";
      thumbVideo.src = videoUrl;

      await new Promise<void>((res) =>
        thumbVideo.addEventListener("loadedmetadata", () => res(), {
          once: true,
        })
      );

      const videoWidth = thumbVideo.videoWidth;
      const videoHeight = thumbVideo.videoHeight;
      const { width: timelineWidth, height: timelineHeight } =
        timelineMeasure ?? {
          width: 0,
          height: 0,
        };

      console.log(
        `Video dimensions: ${videoWidth}x${videoHeight}, Timeline dimensions: ${timelineWidth}x${timelineHeight}`
      );
      const thumbnailHeight = timelineHeight;
      const thumbnailWidth =
        timelineHeight > 0 ? (videoWidth / videoHeight) * thumbnailHeight : 0;
      const numSteps =
        timelineWidth > 0 ? Math.ceil(timelineWidth / thumbnailWidth) + 1 : 0;
      const thumbs = Array.from({ length: numSteps }, (_, i) => {
        const t = (thumbVideo.duration / numSteps) * i;
        return extractVideoFrame(thumbVideo, t, thumbnailWidth / videoWidth);
      });
      console.log("Number of thumbnails to extract:", numSteps);
      console.log("Extracting thumbnails:", thumbs);
      const thumbsRes: FrameData[] = await Promise.all(thumbs);
      console.log("Extracted thumbnails:", thumbsRes);
      setThumbnails(thumbsRes);
    },
    [timelineMeasure]
  );

  // Trigger thumbnail loading when captureFiles change
  useEffect(() => {
    if (src) {
      onLoadedMetadata(src);
    }
  }, [src]);

  return (
    <div className="flex items-center h-12 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
      {/* Play/Pause */}
      <div className="flex items-center gap-1 p-1">
        <Button
          variant={"ghost"}
          size={"sm"}
          className="aspect-square"
          onClick={handlePlayPause}
          tooltip={
            <div className="flex w-full justify-between items-center gap-4 text-sm">
              <span>Play/pause</span>
              <Kbd>Space</Kbd>
            </div>
          }
        >
          {isPlaying ? (
            <Pause className="size-4 fill-foreground" />
          ) : (
            <Play className="size-4 fill-foreground" />
          )}
        </Button>
        <Button
          variant={"ghost"}
          size={"sm"}
          className="aspect-square"
          onClick={handleSkipBackward}
          tooltip={
            <div className="flex w-full justify-between items-center gap-4 text-sm">
              <span>Skip backward 5s</span>
              <Kbd>
                <ArrowLeft className="size-4" />
              </Kbd>
            </div>
          }
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          variant={"ghost"}
          size={"sm"}
          className="aspect-square"
          onClick={handleSkipForward}
          tooltip={
            <div className="flex w-full justify-between items-center gap-4 text-sm">
              <span>Skip forward 5s</span>
              <Kbd>
                <ArrowRight className="size-4" />
              </Kbd>
            </div>
          }
        >
          <RotateCw className="size-4" />
        </Button>
      </div>

      <div
        ref={timelineRef}
        className="relative flex w-full h-full bg-muted-background overflow-clip whitespace-nowrap cursor-pointer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {thumbnailsState.map((thumb) => (
          <Image
            key={thumb.id}
            src={thumb.src}
            alt={`${thumb.timestamp.toFixed(2)}s`}
            className="w-auto h-full pointer-events-none select-none"
            width={0}
            height={0}
            sizes="100vw"
            style={{ imageRendering: "pixelated" }}
          />
        ))}

        <div
          className="absolute top-0 bottom-0 w-[2px] bg-yellow-500 pointer-events-none"
          style={{
            left: videoDuration
              ? `${(currentTime / videoDuration) * 100}%`
              : "0%",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      {/* Capture */}
      <div className="flex items-center w-auto h-full p-2 gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-yellow-400! hover:text-background!"
          onClick={handleCapture}
        >
          <Camera className="size-4" />
          Capture
        </Button>
      </div>
    </div>
  );
}
