"use client";

import React, { useRef, useState } from "react";
import { Play, Pause, Camera } from "lucide-react";
import { FrameData } from "./extract-frames";
import { Button } from "@/components/ui/button";

export type FrameTimelineProps = {
  thumbnails: FrameData[];
  currentTime: number;
  videoDuration: number;
  isPlaying: boolean;
  onSetTime: (t: number) => void;
  onPlayPause: () => void;
  onCapture: () => void;
};

export default function FrameTimeline({
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
    const pct = Math.min(
      Math.max((e.clientX - rect.left) / rect.width, 0),
      1
    );
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

  return (
    <div className="flex items-center py-2 pr-4 bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
      {/* Play/Pause */}
      <button
        onClick={onPlayPause}
        title={isPlaying ? "Pause" : "Play"}
        className="mr-2 p-2"
      >
        {isPlaying ? <Pause size={28} /> : <Play size={28} />}
      </button>

      <div
        ref={stripRef}
        className="relative flex-1 overflow-x-auto whitespace-nowrap cursor-pointer mr-4"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {thumbnails.map((thumb) => (
          <img
            key={thumb.id}
            src={thumb.url}
            alt={`${thumb.timestamp.toFixed(2)}s`}
            className="inline-block rounded-sm"
            style={{
              height: '3rem',
              width: 'auto',
              marginLeft: '-2px',
            }}
          />
        ))}

        {/* Red playhead */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-yellow-500 pointer-events-none"
          style={{
            left: videoDuration
              ? `${(currentTime / videoDuration) * 100}%`
              : '0%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Capture */}
      <Button
        variant="secondary"
        onClick={onCapture}
        title="Capture frame"
        className="px-4 py-2 text-base"
      >
        <Camera className="mr-1" size={20} />
        Capture
      </Button>
    </div>
  );
}

