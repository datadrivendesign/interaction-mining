"use client";
import React from "react";
import { SkipBack, Play, Pause, SkipForward, Camera } from "lucide-react";
import { FrameData } from "./extract-frames";
import { Button } from "@/components/ui/button";

export type FrameTimelineProps = {
  frames: FrameData[];
  currentTime: number;
  videoDuration: number;
  isPlaying: boolean;
  onSetTime: (time: number) => void;
  onPlayPause: () => void;
  onBackward: () => void;
  onForward: () => void;
  onCapture: () => void;
};

export default function FrameTimeline({
  frames,
  currentTime,
  videoDuration,
  isPlaying,
  onSetTime,
  onPlayPause,
  onBackward,
  onForward,
  onCapture,
}: FrameTimelineProps) {
  // Handler for slider updates.
  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onSetTime(newTime);
  };
    // Calculate percentage for the progress fill
    const progressPercent = videoDuration
    ? (currentTime / videoDuration) * 100
    : 0;

  return (
    <div className="relative w-full h-20 p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900">
      {/* Playback Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 p-2 rounded-md bg-white dark:bg-neutral-900">
          <button
            onClick={onBackward}
            title="Back 2 seconds"
            className="text-white hover:text-gray-500"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={onPlayPause}
            title={isPlaying ? "Pause" : "Play"}
            className="text-white hover:text-gray-500"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={onForward}
            title="Forward 2 seconds"
            className="text-white hover:text-gray-500"
          >
            <SkipForward size={20} />
          </button>
        </div>
        {/* Display the current time and total duration */}
        <div className="text-sm text-white">
          {currentTime.toFixed(2)} / {videoDuration.toFixed(2)}
        </div>
        <div>
          <button
            onClick={onCapture}
            title="Capture frame"
            className="p-2 rounded-full bg-white dark:bg-neutral-900 shadow hover:bg-gray-500 dark:hover:bg-neutral-800 text-white hover:text-gray-800 transition"
          >
            <Camera className="mr-1" size={20} />
          </button>
        </div>
      </div>

      {/* Progress Scrubber */}
      <input
        type="range"
        min={0}
        max={videoDuration}
        step="0.01"
        value={currentTime}
        onChange={handleScrubChange}
        onInput={handleScrubChange} // immediate feedback while dragging
        className="w-full h-2 bg-gray-300 rounded-lg appearance-none"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercent}%, #d1d5db ${progressPercent}%, #d1d5db 100%)`,
        }}
      />
    </div>
  );
}
