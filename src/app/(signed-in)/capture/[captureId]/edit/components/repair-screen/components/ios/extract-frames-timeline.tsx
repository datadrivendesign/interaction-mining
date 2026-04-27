"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Play,
  Pause,
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

export type FrameTimelineProps = {
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
  onScrubPreviewTimeChange?: (t: number | null) => void;
  onScrubActiveChange?: (active: boolean) => void;
  onScrubCommit?: (t: number) => void;
  captureMarkers?: {
    id: string;
    timestamp: number;
    isFocused?: boolean;
  }[];
};

export default function FrameTimeline({
  thumbnails,
  currentTime,
  videoDuration,
  isPlaying,
  handleSetTime,
  handlePlayPause,
  handleCapture,
  onScrubPreviewTimeChange,
  onScrubActiveChange,
  onScrubCommit,
  captureMarkers = [],
}: FrameTimelineProps) {
  const TARGET_THUMBNAIL_SLOT_WIDTH = 36;
  const [timelineRef, timelineMeasure] = useMeasure<HTMLDivElement>();
  const [dragging, setDragging] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);

  // Map pointer X -> video time
  const getTimeFromClientX = useCallback(
    (clientX: number) => {
      if (videoDuration <= 0) {
        return;
      }
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      return pct * videoDuration;
    },
    [timelineRef, videoDuration],
  );

  const endScrub = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, shouldCommit: boolean) => {
      if (activePointerIdRef.current !== e.pointerId) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (timelineRef.current?.hasPointerCapture(e.pointerId)) {
        timelineRef.current.releasePointerCapture(e.pointerId);
      }
      if (shouldCommit && dragging) {
        const t = getTimeFromClientX(e.clientX);
        if (t !== undefined) {
          onScrubPreviewTimeChange?.(t);
          onScrubCommit?.(t);
        }
      } else {
        onScrubPreviewTimeChange?.(null);
      }
      activePointerIdRef.current = null;
      setDragging(false);
      onScrubActiveChange?.(false);
    },
    [
      dragging,
      getTimeFromClientX,
      onScrubActiveChange,
      onScrubCommit,
      onScrubPreviewTimeChange,
      timelineRef,
    ],
  );

  // Start scrub on pointer down
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || videoDuration <= 0) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    activePointerIdRef.current = e.pointerId;
    timelineRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    onScrubActiveChange?.(true);
    const t = getTimeFromClientX(e.clientX);
    if (t !== undefined) {
      onScrubPreviewTimeChange?.(t);
    }
  };

  // Scrub on pointer move when dragging
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || activePointerIdRef.current !== e.pointerId) {
      return;
    }
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const t = getTimeFromClientX(e.clientX);
    if (t === undefined) {
      return;
    }
    onScrubPreviewTimeChange?.(t);
  };

  // End scrub on pointer up
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    endScrub(e, true);
  };

  const scrubProgressPercent =
    videoDuration > 0
      ? Math.min(Math.max((currentTime / videoDuration) * 100, 0), 100)
      : 0;
  const scrubOffsetPx =
    timelineMeasure && timelineMeasure.width > 0
      ? (scrubProgressPercent / 100) * timelineMeasure.width
      : 0;
  const scrubMotionTransition = dragging
    ? { type: "tween" as const, ease: "linear" as const, duration: 0.04 }
    : spring({ duration: 0.12 });

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
    const { width: timelineWidth } = timelineMeasure ?? { width: 0 };
    const slotCount =
      timelineWidth > 0
        ? Math.max(1, Math.ceil(timelineWidth / TARGET_THUMBNAIL_SLOT_WIDTH))
        : 0;

    return Array.from({ length: slotCount }, (_, i) => {
      const targetTime =
        slotCount === 1 ? 0 : (i / (slotCount - 1)) * videoDuration;
      return thumbnails.reduce((prev, curr) =>
        Math.abs(curr.timestamp - targetTime) <
        Math.abs(prev.timestamp - targetTime)
          ? curr
          : prev,
      );
    });
  }, [thumbnails, timelineMeasure, videoDuration]);

  const visibleCaptureMarkers = useMemo(() => {
    if (videoDuration <= 0 || captureMarkers.length === 0) {
      return [];
    }

    return captureMarkers
      .filter((marker) => Number.isFinite(marker.timestamp))
      .map((marker) => ({
        ...marker,
        percent: Math.min(
          Math.max((marker.timestamp / videoDuration) * 100, 0),
          100,
        ),
      }));
  }, [captureMarkers, videoDuration]);

  return (
    <div className="flex items-center h-12 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
      {/* Play/Pause */}
      <div className="flex shrink-0 items-center gap-1 bg-neutral-50 p-1 dark:bg-neutral-950">
        <span className="hidden md:inline-flex gap-1 tabular-nums text-xs text-muted-foreground font-medium px-2">
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
            <div className="flex w-full justify-between items-center gap-2 text-sm">
              <span>Play/pause</span>
              <Kbd className="text-muted-foreground rounded-sm">Space</Kbd>
            </div>
          }
          delayDuration={0}
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
          className="hidden md:inline-flex aspect-square"
          onClick={handleSkipBackward}
          tooltip={
            <div className="flex w-full justify-between items-center gap-4 text-sm">
              <span>Skip backward 5s</span>
              <Kbd className="text-muted-foreground rounded-sm">
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
          className="hidden md:inline-flex aspect-square"
          onClick={handleSkipForward}
          tooltip={
            <div className="flex w-full justify-between items-center gap-4 text-sm">
              <span>Skip forward 5s</span>
              <Kbd className="text-muted-foreground rounded-sm">
                <ArrowRight className="size-4" />
              </Kbd>
            </div>
          }
        >
          <RotateCw className="size-4" />
        </Button>
      </div>

      <div className="h-full min-w-0 flex-1 basis-0 overflow-hidden">
        <div
          ref={timelineRef}
          className="relative flex h-full w-full bg-muted-background overflow-hidden cursor-pointer touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={(e) => endScrub(e, false)}
          onLostPointerCapture={(e) => endScrub(e, false)}
          onDragStart={(e) => e.preventDefault()}
        >
          <div
            className="grid h-full w-full pointer-events-none select-none overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${Math.max(displayedThumbnails.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {displayedThumbnails.map((thumb, index) => (
              <div key={thumb.src + index} className="relative h-full min-w-0">
                <Image
                  src={thumb.src}
                  alt={`${thumb.timestamp.toFixed(2)}s`}
                  className="h-full w-full object-cover"
                  width={thumb.width}
                  height={thumb.height}
                  sizes="100vw"
                  draggable={false}
                  style={{ imageRendering: "crisp-edges" }}
                />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0">
            {visibleCaptureMarkers.map((marker) => (
              <div
                key={marker.id}
                className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${marker.percent}%` }}
              >
                <div
                  className={
                    marker.isFocused
                      ? "size-2.5 rounded-full bg-yellow-500 border-2 border-black shadow-[0_0_0_1px_rgba(255,255,255,0.6),0_0_8px_rgba(234,179,8,0.22)]"
                      : "size-2 rounded-full border-2 border-black bg-white/58"
                  }
                />
              </div>
            ))}
          </div>

          <motion.div
            className="absolute inset-y-0 left-0 pointer-events-none bg-yellow-400/20"
            animate={{ width: scrubOffsetPx }}
            transition={scrubMotionTransition}
            style={{ willChange: "width" }}
          />

          <motion.div
            className="absolute inset-y-0 left-0 pointer-events-none border-r border-yellow-500/35"
            animate={{ width: scrubOffsetPx }}
            transition={scrubMotionTransition}
            style={{ willChange: "width" }}
          />

          <motion.div
            className="absolute top-0 bottom-0 left-0 pointer-events-auto"
            animate={{
              opacity: dragging ? 0.92 : 1,
              x: scrubOffsetPx,
              scale: dragging ? 1.03 : 1,
            }}
            transition={scrubMotionTransition}
            style={{ willChange: "transform" }}
          >
            {dragging ? (
              <div className="relative h-full -translate-x-1/2">
                <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.45)]" />
                <div className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-100/80 bg-yellow-400 shadow-sm" />
              </div>
            ) : (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative h-full -translate-x-1/2">
                      <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.45)]" />
                      <div className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-yellow-100/80 bg-yellow-400 shadow-sm" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex w-full justify-between items-center gap-4 text-sm">
                      <span>Drag yellow bar to scrub</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </motion.div>
        </div>
      </div>

      {/* Capture */}
      <div className="flex h-full shrink-0 items-center gap-4 bg-neutral-50 p-2 dark:bg-neutral-950">
        <Button
          variant="default"
          size="sm"
          className="hover:bg-yellow-400! hover:text-black!"
          onClick={handleCapture}
          tooltip={
            <div className="flex w-full justify-between items-center gap-2 text-sm">
              <span>Tap</span>
              <Kbd className="text-muted-foreground rounded-sm">C</Kbd>
              <span>to Capture</span>
            </div>
          }
          delayDuration={0}
        >
          Capture
          <Kbd className="text-muted-foreground rounded-sm">C</Kbd>
        </Button>
      </div>
    </div>
  );
}
