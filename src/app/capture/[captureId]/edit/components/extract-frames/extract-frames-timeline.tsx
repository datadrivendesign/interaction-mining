"use client";
import React from "react";
import { SkipBack, Play, Pause, SkipForward } from "lucide-react";
import { FrameData } from "./extract-frames";

export type FrameTimelineProps = {
  frames: FrameData[]; // optional—if needed for extra purposes
  currentTime: number;
  videoDuration: number;
  isPlaying: boolean;
  onSetTime: (time: number) => void;
  onPlayPause: () => void;
  onBackward: () => void;
  onForward: () => void;
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
}: FrameTimelineProps) {
  // Handler for when the scrubber (range input) is used.
  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onSetTime(newTime);
  };

  return (
    <div className="relative w-full h-20 p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900">
      {/* Playback Controls (placed at the top-left) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackward}
            title="Back 2 seconds"
            className="text-gray-600 hover:text-gray-800"
          >
            <SkipBack size={20} />
          </button>
          <button
            onClick={onPlayPause}
            title={isPlaying ? "Pause" : "Play"}
            className="text-gray-600 hover:text-gray-800"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={onForward}
            title="Forward 2 seconds"
            className="text-gray-600 hover:text-gray-800"
          >
            <SkipForward size={20} />
          </button>
        </div>
        {/* Display current time and total duration */}
        <div className="text-sm text-gray-600">
          {currentTime.toFixed(2)} / {videoDuration.toFixed(2)}
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
        className="w-full h-2 bg-gray-300 rounded-lg appearance-none"
      />
    </div>
  );
}
