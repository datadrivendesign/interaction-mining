"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FrameData } from "../../../edit/components/types";
import { ScreenComment } from "./screen-comments-panel";
import { findTraceIssue } from "./trace-issues";

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
  const [hoveredScreenId, setHoveredScreenId] = useState<string | null>(null);
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
          <p className="text-[12px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Screen Markers
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Drag anywhere on the strip or press{" "}
            <span className="font-medium">[ ]</span> to jump screens.
          </p>
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative h-12 cursor-ew-resize touch-none select-none"
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
          const comments = commentsByScreen[screen.id] ?? [];
          const issueCount = comments.length;
          const hasIssues = issueCount > 0;
          const isActive = screen.id === activeScreenId;
          const previewLines = comments.slice(0, 3).map((comment, commentIndex) => {
            const issue = findTraceIssue(comment.issueId ?? "");
            return {
              key: `${comment.id}:${commentIndex}`,
              text: issue?.chipLabel ?? issue?.label ?? comment.text,
            };
          });
          const hiddenCount = comments.length - previewLines.length;
          const isPreviewVisible = hoveredScreenId === screen.id || isActive;

          return (
            <button
              key={screen.id}
              type="button"
              className="absolute top-0 -translate-x-1/2 text-center"
              style={{ left: `${position}%` }}
              onPointerDown={(event) => event.stopPropagation()}
              onMouseEnter={() => setHoveredScreenId(screen.id)}
              onMouseLeave={() => setHoveredScreenId((prev) =>
                prev === screen.id ? null : prev,
              )}
              onFocus={() => setHoveredScreenId(screen.id)}
              onBlur={() =>
                setHoveredScreenId((prev) =>
                  prev === screen.id ? null : prev,
                )
              }
              onClick={() => onSelectScreen(screen.id, screen.timestamp)}
            >
              {isPreviewVisible && hasIssues && (
                <span className="pointer-events-none absolute left-1/2 top-5 z-20 w-44 -translate-x-1/2 select-none rounded-md border border-neutral-200 bg-white/95 px-2 py-1.5 text-left shadow-md dark:border-neutral-700 dark:bg-neutral-950/95">
                  <span className="block text-[9px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                    Screen {index + 1} • {screen.timestamp.toFixed(1)}s
                  </span>
                  <span className="mt-1 block space-y-0.5 text-[10px] leading-snug text-neutral-700 dark:text-neutral-200">
                    {previewLines.map((line) => (
                      <span key={line.key} className="block truncate">
                        {line.text}
                      </span>
                    ))}
                    {hiddenCount > 0 && (
                      <span className="block text-neutral-500 dark:text-neutral-400">
                        +{hiddenCount} more
                      </span>
                    )}
                  </span>
                </span>
              )}
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
