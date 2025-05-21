"use client";

import React, { useRef, useState } from "react";
import { Play, Pause, Camera, Rewind, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FrameData } from "../types";
import Image from "next/image";
import mergeRefs from "@/lib/utils/merge-refs";

export type FrameTimelineProps = {
  ref: React.Ref<HTMLDivElement>;
  thumbnails: FrameData[];
  currentTime: number;
  videoDuration: number;
  isPlaying: boolean;
  onSetTime: (t: number) => void;
  onPlayPause: () => void;
  onCapture: () => void;
};

export default function FrameTimeline({
  ref,
  thumbnails,
  currentTime,
  videoDuration,
  isPlaying,
  onSetTime,
  onPlayPause,
  onCapture,
}: FrameTimelineProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Map pointer X -> video time
  const getTimeFromEvent = (e: MouseEvent | React.MouseEvent) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    return pct * videoDuration;
  };

  // Start scrub on pointer down
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    stripRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    const t = getTimeFromEvent(e);
    if (t !== undefined) onSetTime(t);
    if (!isPlaying) onPlayPause();
  };

  // Scrub on pointer move when dragging
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const t = getTimeFromEvent(e);
    if (t !== undefined) onSetTime(t);
  };

  // End scrub on pointer up
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    stripRef.current?.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(currentTime + 5, videoDuration);
    onSetTime(newTime);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(currentTime - 5, 0);
    onSetTime(newTime);
  };

  return (
    <div className="flex items-center h-12 bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
      {/* Play/Pause */}
      <div className="flex items-center px-4 gap-4">
        <button onClick={onPlayPause} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? (
            <Pause className="size-4 fill-foreground" />
          ) : (
            <Play className="size-4 fill-foreground" />
          )}
        </button>
        <button onClick={handleSkipBackward} title="Skip backward 5s">
          <RotateCcw className="size-4" />
        </button>
        <button onClick={handleSkipForward} title="Skip forward 5s">
          <RotateCw className="size-4" />
        </button>
      </div>

      <div
        ref={mergeRefs(stripRef, ref)}
        className="relative flex w-full h-full overflow-x-auto whitespace-nowrap cursor-pointer"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {thumbnails.map((thumb) => (
          <Image
            key={thumb.id}
            src={thumb.src}
            alt={`${thumb.timestamp.toFixed(2)}s`}
            className="w-auto h-full pointer-events-none"
            width={0}
            height={0}
            sizes="100vw"
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
      <button className="inline-flex items-center px-4" onClick={onCapture}>
        <Camera className="mr-1" size={20} />
        Capture
      </button>
    </div>
  );
}
