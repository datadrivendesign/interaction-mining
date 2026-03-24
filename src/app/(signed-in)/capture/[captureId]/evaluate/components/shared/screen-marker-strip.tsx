"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { FrameData } from "../../../edit/components/types";
import { ScreenComment } from "./screen-comments-panel";
import Kbd from "@/components/ui/kbd";

function getMarkerPosition(timestamp: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  return Math.max(0, Math.min((timestamp / duration) * 100, 100));
}

export function ScreenMarkerStrip({
  screens,
  activeScreenId,
  commentsByScreen,
  currentTime,
  duration,
  onSelectScreen,
  onScrub,
}: {
  screens: FrameData[];
  activeScreenId: string | null;
  commentsByScreen: Record<string, ScreenComment[]>;
  currentTime: number;
  duration: number;
  onSelectScreen: (screenId: string, timestamp: number) => void;
  onScrub: (timestamp: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);
  const sortedScreens = [...screens].sort((a, b) => a.timestamp - b.timestamp);
  const fallbackDuration =
    duration > 0
      ? duration
      : Math.max(
          sortedScreens[sortedScreens.length - 1]?.timestamp ?? 0,
          currentTime,
          1,
        );
  const playheadPosition = getMarkerPosition(currentTime, fallbackDuration);

  const scrubToClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || fallbackDuration <= 0) {
        return;
      }

      const bounds = track.getBoundingClientRect();
      if (bounds.width <= 0) {
        return;
      }

      const position = Math.max(
        0,
        Math.min((clientX - bounds.left) / bounds.width, 1),
      );
      onScrub(position * fallbackDuration);
    },
    [fallbackDuration, onScrub],
  );

  const handleTrackPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      isScrubbingRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      scrubToClientX(event.clientX);
    },
    [scrubToClientX],
  );

  const handleTrackPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isScrubbingRef.current) {
        return;
      }

      scrubToClientX(event.clientX);
    },
    [scrubToClientX],
  );

  const handleTrackPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isScrubbingRef.current) {
        return;
      }

      isScrubbingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      scrubToClientX(event.clientX);
    },
    [scrubToClientX],
  );

  if (sortedScreens.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-xl border border-neutral-200 bg-white/90 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/70">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Screen Markers
          </p>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
            Drag anywhere on the strip or press{" "}
            <Kbd className="font-medium">[ ]</Kbd> to jump screens.
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {sortedScreens.length} screens
        </span>
      </div>

      <div
        ref={trackRef}
        className="relative h-12 cursor-ew-resize touch-none"
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        onPointerCancel={handleTrackPointerUp}
      >
        <div className="absolute inset-x-0 top-3 h-px bg-neutral-200 dark:bg-neutral-700" />
        <div
          className="absolute top-0 h-6 w-px bg-neutral-400/80 dark:bg-neutral-500/80"
          style={{ left: `${playheadPosition}%` }}
        />

        {sortedScreens.map((screen, index) => {
          const position = getMarkerPosition(
            screen.timestamp,
            fallbackDuration,
          );
          const issueCount = commentsByScreen[screen.id]?.length ?? 0;
          const hasIssues = issueCount > 0;
          const isActive = screen.id === activeScreenId;

          return (
            <button
              key={screen.id}
              type="button"
              title={`Screen ${index + 1} at ${screen.timestamp.toFixed(1)}s`}
              className="absolute top-0 -translate-x-1/2 text-center"
              style={{ left: `${position}%` }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onSelectScreen(screen.id, screen.timestamp)}
            >
              <span
                className={cn(
                  "mx-auto block size-3 rounded-full border-2 transition-all",
                  isActive
                    ? hasIssues
                      ? "border-red-600 bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.12)] dark:border-red-400 dark:bg-red-400"
                      : "border-neutral-900 bg-neutral-900 shadow-[0_0_0_4px_rgba(23,23,23,0.12)] dark:border-white dark:bg-white"
                    : hasIssues
                      ? "border-red-400 bg-white dark:border-red-500 dark:bg-neutral-900"
                      : "border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900",
                )}
              />
              <span
                className={cn(
                  "mt-1 block text-[9px] font-medium leading-none",
                  isActive
                    ? "text-neutral-800 dark:text-neutral-100"
                    : "text-neutral-500 dark:text-neutral-400",
                )}
              >
                {index + 1}
              </span>
              {hasIssues && (
                <span className="mt-0.5 block text-[9px] leading-none text-red-500 dark:text-red-400">
                  {issueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
