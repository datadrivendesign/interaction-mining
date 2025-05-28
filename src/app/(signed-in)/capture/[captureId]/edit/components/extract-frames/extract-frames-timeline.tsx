"use client";

import React, { useState, useMemo } from "react";
import {
  Play,
  Pause,
  Camera,
  RotateCcw,
  RotateCw,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import Kbd from "@/components/ui/kbd";
import useMeasure from "@/lib/hooks/useMeasure";
import { spring } from "@/lib/motion";
import { DateTime } from "luxon";

export type FrameTimelineProps = {
  src: string;
  thumbnails: {
    src: string;
    timestamp: number;
    width: number;
    height: number;
  }[];
  currentTime: number;
  videoDuration: number;
  isPlaying: boolean;
  handleSetTime: (t: number) => void;
  handlePlayPause: () => void;
  handleCapture: () => void;
};

export default function FrameTimeline({
  thumbnails,
  currentTime,
  videoDuration,
  isPlaying,
  handleSetTime,
  handlePlayPause,
  handleCapture,
}: FrameTimelineProps) {
  const [timelineRef, timelineMeasure] = useMeasure<HTMLDivElement>();
  const [dragging, setDragging] = useState(false);

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
    if (dragging) {
      const t = getTimeFromEvent(e);
      if (t !== undefined) handleSetTime(t);
    }
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

  const displayedThumbnails = useMemo(() => {
    if (!thumbnails || thumbnails.length === 0) return [];
    const { width: timelineWidth, height: timelineHeight } =
      timelineMeasure ?? { width: 0, height: 0 };

    const { width: videoWidth, height: videoHeight } = thumbnails[0];

    const displayHeight = timelineHeight;
    const thumbnailWidth =
      timelineHeight > 0 ? (videoWidth / videoHeight) * displayHeight : 0;
    const slotCount =
      timelineWidth > 0 ? Math.ceil(timelineWidth / thumbnailWidth) + 1 : 0;

    // Build quantized thumbnails list
    const res = Array.from({ length: slotCount }, (_, i) => {
      // Compute target time for this slot
      const targetTime =
        slotCount === 1 ? 0 : (i / (slotCount - 1)) * videoDuration;
      // Select the thumbnail closest to the target time
      return thumbnails.reduce((prev, curr) =>
        Math.abs(curr.timestamp - targetTime) <
        Math.abs(prev.timestamp - targetTime)
          ? curr
          : prev
      );
    });

    return res;
  }, [thumbnails, timelineMeasure, videoDuration]);

  return (
    <div className="flex items-center h-12 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
      {/* Play/Pause */}
      <div className="flex items-center gap-1 p-1">
        <span className="inline-flex gap-1 tabular-nums text-xs text-muted-foreground font-medium px-2">
          {DateTime.fromSeconds(currentTime).toFormat("mm:ss")}/
          {videoDuration
            ? DateTime.fromSeconds(videoDuration).toFormat("mm:ss")
            : "--:--"}
        </span>
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
        {displayedThumbnails.map((thumb, index) => (
          <Image
            key={thumb.src + index}
            src={thumb.src}
            alt={`${thumb.timestamp.toFixed(2)}s`}
            className="w-auto h-full pointer-events-none select-none"
            width={0}
            height={0}
            sizes="100vw"
            draggable={false}
            style={{ imageRendering: "crisp-edges" }}
          />
        ))}

        <motion.div
          className="absolute top-0 bottom-0 w-full h-full pointer-events-none"
          animate={{
            opacity: dragging ? 0.5 : 1,
            x: `${(currentTime / videoDuration) * 100}%`,
          }}
          transition={dragging ? { duration: 0 } : spring({ duration: 0.125 })}
        >
          <div className="w-[2px] h-full bg-yellow-500 rounded" />
        </motion.div>
      </div>

      {/* Capture */}
      <div className="flex items-center w-auto h-full p-2 gap-4">
        <Button
          variant="secondary"
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
