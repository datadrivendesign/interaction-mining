"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
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

/** Markers this close to either end (percent) open their popup inward. */
const POPUP_EDGE_PERCENT = 25;

export function ScreenMarkerStrip({
  screens,
  activeScreenId,
  commentsByScreen,
  currentTime,
  duration,
  onSelectScreen,
  onScrub,
  headerAccessory,
  gapsByScreenId = {},
}: {
  screens: FrameData[];
  activeScreenId: string | null;
  commentsByScreen: Record<string, ScreenComment[]>;
  currentTime: number;
  duration: number;
  onSelectScreen: (screenId: string, timestamp: number) => void;
  onScrub: (timestamp: number) => void;
  headerAccessory?: ReactNode;
  /** Long gaps before a screen (see `findScreenGaps`), drawn as bands. */
  gapsByScreenId?: Record<string, number>;
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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
            Screen Markers
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Click a marker, drag anywhere on the strip, press{" "}
            <span className="font-medium">[ ]</span> to jump screens, or{" "}
            <span className="font-medium">Space</span> to play or pause.
          </p>
        </div>
        {headerAccessory ? (
          <div className="shrink-0 self-center">{headerAccessory}</div>
        ) : null}
      </div>

      <div
        ref={trackRef}
        className="relative h-14 cursor-ew-resize touch-none select-none"
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        onPointerCancel={handleTrackPointerUp}
      >
        <div className="absolute inset-x-0 top-8 h-px bg-neutral-200 dark:bg-neutral-700" />
        {sortedScreens.map((screen, index) => {
          const gap = gapsByScreenId[screen.id];
          if (gap === undefined || index === 0) return null;
          const start = getMarkerPosition(
            sortedScreens[index - 1].timestamp,
            fallbackDuration,
          );
          const end = getMarkerPosition(screen.timestamp, fallbackDuration);
          return (
            <div
              key={`gap-${screen.id}`}
              className="pointer-events-none absolute top-[30px] h-1.5 rounded-sm border border-dashed border-amber-500 bg-amber-100 dark:bg-amber-950/60"
              style={{ left: `${start}%`, width: `${end - start}%` }}
              title={`${Math.round(gap)} s gap between screens ${index} and ${index + 1}`}
            />
          );
        })}
        {/* Playhead: a handle and the time above the markers (feedback popups
            open below them), and a line down through the markers. */}
        <div
          className="pointer-events-none absolute top-2 h-11 w-0.5 -translate-x-1/2 bg-blue-600 dark:bg-blue-400"
          style={{ left: `${playheadPosition}%` }}
        />
        <div
          className="absolute top-0 z-10 flex -translate-x-1/2 cursor-grab items-center active:cursor-grabbing"
          style={{ left: `${playheadPosition}%` }}
          aria-hidden
        >
          <span className="block size-3.5 rounded-full border-2 border-white bg-blue-600 shadow ring-1 ring-blue-600/40 dark:border-neutral-900 dark:bg-blue-400" />
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 font-mono text-[11px] font-semibold whitespace-nowrap text-blue-700 tabular-nums dark:text-blue-300",
              playheadPosition > 85 ? "right-5" : "left-5",
            )}
          >
            {currentTime.toFixed(1)} s
          </span>
        </div>

        {sortedScreens.map((screen, index) => {
          const position = getMarkerPosition(
            screen.timestamp,
            fallbackDuration,
          );
          const comments = commentsByScreen[screen.id] ?? [];
          const issueCount = comments.length;
          const hasIssues = issueCount > 0;
          const isActive = screen.id === activeScreenId;
          const previewLines = comments
            .slice(0, 3)
            .map((comment, commentIndex) => {
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
              className="absolute top-5 -translate-x-1/2 text-center"
              style={{ left: `${position}%` }}
              title={`Focus Screen ${index + 1}`}
              aria-label={`Focus Screen ${index + 1} at ${screen.timestamp.toFixed(1)} seconds`}
              onPointerDown={(event) => event.stopPropagation()}
              onMouseEnter={() => setHoveredScreenId(screen.id)}
              onMouseLeave={() =>
                setHoveredScreenId((prev) => (prev === screen.id ? null : prev))
              }
              onFocus={() => setHoveredScreenId(screen.id)}
              onBlur={() =>
                setHoveredScreenId((prev) => (prev === screen.id ? null : prev))
              }
              onClick={() => onSelectScreen(screen.id, screen.timestamp)}
            >
              {isPreviewVisible && hasIssues && (
                <span
                  className={cn(
                    "pointer-events-none absolute top-5 z-20 w-44 rounded-md border border-neutral-200 bg-white/95 px-2 py-1.5 text-left shadow-md select-none dark:border-neutral-700 dark:bg-neutral-950/95",
                    // Near either end, open toward the middle so the popup
                    // stays inside the strip instead of past its edge.
                    position < POPUP_EDGE_PERCENT
                      ? "-left-1"
                      : position > 100 - POPUP_EDGE_PERCENT
                        ? "-right-1"
                        : "left-1/2 -translate-x-1/2",
                  )}
                >
                  <span className="block text-[9px] font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
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
                  "mx-auto block size-3 cursor-pointer rounded-full border-2 transition-all",
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
                  "mt-1 block text-[9px] leading-none font-medium",
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
