"use client";

import React from "react";
import { FrameData } from "./extract-frames";

export default function FrameTimeline({
  frames,
  setTime,
}: {
  frames: FrameData[];
  setTime: (time: number) => void;
}) {
  return (
    <div className="relative w-full h-16 flex items-center px-6 overflow-x-auto">
      {/* Gray timeline line */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 transform -translate-y-1/2 z-0" />

      {/* Circles for each frame */}
      <div className="relative z-10 flex gap-8">
        {frames.map((frame) => (
          <div
            key={frame.id}
            className="w-6 h-6 bg-blue-500 rounded-full cursor-pointer border-2 border-white shadow-md hover:scale-110 transition"
            onClick={() => setTime(frame.timestamp)}
            title={`${frame.timestamp.toFixed(2)}s`}
          />
        ))}
      </div>
    </div>
  );
}