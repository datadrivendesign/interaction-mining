"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  findGestureOption,
  normalizeGestureType,
} from "@/lib/utils/gesture-options";
import Image from "next/image";
import { TraceFormData } from "../../../edit/components/types";
import { useMeasure } from "@uidotdev/usehooks";
import type { ScreenGesture } from "@prisma/client";
import { useState } from "react";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";
import { cn } from "@/lib/utils";
import { ScreenComment } from "../shared/screen-comments-panel";

export function ReviewGalleryIOS({
  traceData,
  activeScreenId,
  commentsByScreen,
  onScreenSelect,
}: {
  traceData: TraceFormData;
  activeScreenId: string | null;
  commentsByScreen: Record<string, ScreenComment[]>;
  onScreenSelect: (id: string, timestamp: number) => void;
}) {
  const [orientationByScreenId, setOrientationByScreenId] = useState<
    Record<string, "portrait" | "landscape">
  >({});
  const sortedScreens = [...traceData.screens].sort(
    (a, b) => a.timestamp - b.timestamp,
  );
  const screensWithIssues = sortedScreens.filter(
    (screen) => (commentsByScreen[screen.id]?.length ?? 0) > 0,
  ).length;

  return (
    <section className="flex flex-col w-full h-full">
      {/* Description strip — matches panel header style */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 h-9 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
        <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-600 shrink-0">
          Gallery
        </span>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
          {sortedScreens.length} screen{sortedScreens.length === 1 ? "" : "s"}
          {screensWithIssues > 0 ? ` • ${screensWithIssues} flagged` : ""}
        </p>
      </div>

      {/* Scroll area */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden touch-auto px-4 pt-4 pb-3">
        <div className="flex h-full items-start gap-3 pb-1">
          {sortedScreens.map((screen, index) => (
            <ReviewFigureIOS
              key={screen.id}
              index={index}
              screen={screen}
              gesture={traceData.gestures[screen.id]}
              redactions={traceData.redactions[screen.id] || []}
              isActive={screen.id === activeScreenId}
              issueCount={commentsByScreen[screen.id]?.length ?? 0}
              isLandscape={orientationByScreenId[screen.id] === "landscape"}
              onImageLoad={(img) => {
                if (!img.naturalWidth || !img.naturalHeight) return;
                setOrientationByScreenId((prev) => ({
                  ...prev,
                  [screen.id]:
                    img.naturalWidth > img.naturalHeight
                      ? "landscape"
                      : "portrait",
                }));
              }}
              onJump={() => {
                onScreenSelect(screen.id, screen.timestamp);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewFigureIOS({
  index,
  screen,
  gesture,
  redactions,
  isActive,
  issueCount,
  isLandscape,
  onImageLoad,
  onJump,
}: {
  index: number;
  screen: TraceFormData["screens"][number];
  gesture?: ScreenGesture;
  redactions: TraceFormData["redactions"][string];
  isActive: boolean;
  issueCount: number;
  isLandscape: boolean;
  onImageLoad: (img: HTMLImageElement) => void;
  onJump: () => void;
}) {
  const [containerRef, { width, height }] = useMeasure();
  const canvasWidth = width ?? 0;
  const canvasHeight = height ?? 0;

  const isDrag =
    gesture &&
    normalizeGestureType(gesture.type) === GESTURE_TYPES.DRAG &&
    gesture.x !== null &&
    gesture.y !== null &&
    gesture.scrollDeltaX !== null &&
    gesture.scrollDeltaY !== null &&
    canvasWidth > 0 &&
    canvasHeight > 0;

  const startX = isDrag ? gesture.x! * canvasWidth : 0;
  const startY = isDrag ? gesture.y! * canvasHeight : 0;
  const endX = isDrag ? (gesture.x! + gesture.scrollDeltaX!) * canvasWidth : 0;
  const endY = isDrag ? (gesture.y! + gesture.scrollDeltaY!) * canvasHeight : 0;

  const cardWidthClass = isLandscape
    ? "w-[80%] sm:w-[70%] md:w-[62%] lg:w-[54%] xl:w-[46%]"
    : "w-[52%] sm:w-[46%] md:w-[40%] lg:w-[34%] xl:w-[30%]";
  const hasIssues = issueCount > 0;
  const imageBorderClass = isActive
    ? hasIssues
      ? "border-red-500 dark:border-red-400 shadow-md ring-2 ring-red-500/20 dark:ring-red-400/20 ring-offset-1"
      : "border-neutral-900 dark:border-white shadow-md ring-2 ring-neutral-900/20 dark:ring-white/20 ring-offset-1"
    : hasIssues
      ? "border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600"
      : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-500";
  const placeholderBorderClass = isActive
    ? hasIssues
      ? "border-red-500 dark:border-red-400"
      : "border-neutral-900 dark:border-white"
    : hasIssues
      ? "border-red-300 dark:border-red-700"
      : "border-neutral-300 dark:border-neutral-700";

  return (
    <figure className={`relative flex flex-col shrink-0 ${cardWidthClass}`}>
      <div
        className="relative w-full cursor-pointer"
        onClick={onJump}
        ref={containerRef}
      >
        {hasIssues && (
          <div className="absolute top-1 left-1 z-20 min-w-[1.25rem] rounded-full bg-red-500 px-1 py-0.5 text-center font-mono text-[10px] leading-none text-white shadow-sm">
            {issueCount}
          </div>
        )}

        {/* Screen number */}
        <div className="absolute top-1 right-1 z-20 bg-black/60 text-white text-[10px] font-mono rounded px-1 py-0.5 min-w-[1.25rem] text-center leading-none">
          {index + 1}
        </div>

        <TooltipProvider delayDuration={100}>
          {screen.src.length > 0 ? (
            <Image
              src={screen.src}
              alt={screen.id}
              width={0}
              height={0}
              sizes="100vw"
              className={cn(
                "relative z-0 w-full h-auto rounded-lg object-contain border-2 transition-all duration-150",
                imageBorderClass,
              )}
              onLoad={(event) => onImageLoad(event.currentTarget)}
            />
          ) : (
            <div
              className={cn(
                "w-full aspect-[9/19] bg-neutral-100 dark:bg-neutral-800 rounded-lg border-2 transition-all duration-150",
                placeholderBorderClass,
              )}
            />
          )}

          {isDrag && (
            <svg
              className="absolute inset-0 z-10 w-full h-full pointer-events-none overflow-visible"
              width="100%"
              height="100%"
            >
              <defs>
                <marker
                  id={`dragArrowHead-${screen.id}`}
                  viewBox="0 0 8 8"
                  markerWidth="5"
                  markerHeight="5"
                  refX="7"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,8 L8,4 z" fill="rgba(23,23,23,0.72)" />
                </marker>
              </defs>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="rgba(23,23,23,0.72)"
                strokeWidth="2"
                markerEnd={`url(#dragArrowHead-${screen.id})`}
              />
              <circle
                cx={endX}
                cy={endY}
                r="5"
                fill="white"
                stroke="rgba(23,23,23,0.92)"
                strokeWidth="1.8"
              />
            </svg>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              {gesture ? (
                <div
                  className="cursor-pointer absolute z-20 rounded-full bg-yellow-300 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-85 w-7 h-7 md:w-8 md:h-8"
                  style={{
                    left: `${(gesture.x ?? 0) * 100}%`,
                    top: `${(gesture.y ?? 0) * 100}%`,
                  }}
                >
                  {findGestureOption(gesture.type)?.icon}
                </div>
              ) : (
                <span />
              )}
            </TooltipTrigger>
            {gesture && (
              <TooltipContent side="top" sideOffset={5} className="z-50">
                <p>{gesture.type}</p>
              </TooltipContent>
            )}
          </Tooltip>

          {redactions.map((redaction) => (
            <Tooltip key={redaction.id}>
              <TooltipTrigger asChild>
                <div
                  className="absolute z-15 bg-black border-1 border-yellow-500 cursor-pointer hover:shadow-yellow-500/50 hover:shadow-lg"
                  style={{
                    left: `${redaction.x * 100}%`,
                    top: `${redaction.y * 100}%`,
                    width: `${redaction.width * 100}%`,
                    height: `${redaction.height * 100}%`,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={10}>
                <p>{redaction.annotation}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {/* Label — always visible */}
      <p
        className={cn(
          "text-xs text-center leading-snug pt-1.5 pb-0.5 px-1 truncate transition-colors duration-150",
          isActive
            ? "text-neutral-900 dark:text-neutral-200 font-medium"
            : "text-neutral-600 dark:text-neutral-400",
        )}
      >
        {gesture?.description ?? "—"}
      </p>
    </figure>
  );
}
