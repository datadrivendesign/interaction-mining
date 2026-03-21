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
import { FrameData, TraceFormData } from "../../../edit/components/types";
import { useMemo } from "react";
import { useMeasure } from "@uidotdev/usehooks";
import type { ScreenGesture } from "@prisma/client";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";
import { cn } from "@/lib/utils";

export function ReviewGalleryAndroid({
  traceData,
  activeScreenId,
  onScreenSelect,
}: {
  traceData: TraceFormData;
  activeScreenId: string | null;
  onScreenSelect: (id: string) => void;
}) {
  return (
    <section className="flex flex-col w-full h-full">
      {/* Description strip — matches panel header style */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 h-9 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
        <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-600 shrink-0">
          Task
        </span>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
          {traceData.description ?? "No description provided."}
        </p>
      </div>

      {/* Scroll area */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden touch-auto px-4 pt-4 pb-3">
        <div className="flex h-full items-start gap-3 pb-1">
          {traceData.screens
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((screen, index) => (
              <ReviewFigureAndroid
                key={screen.id}
                index={index}
                screen={screen}
                vh={traceData.vhs?.[screen.id]}
                gesture={traceData.gestures[screen.id]}
                redactions={traceData.redactions[screen.id] || []}
                isActive={screen.id === activeScreenId}
                onSelect={() => onScreenSelect(screen.id)}
              />
            ))}
        </div>
      </div>
    </section>
  );
}

function ReviewFigureAndroid({
  index,
  screen,
  vh,
  gesture,
  redactions,
  isActive,
  onSelect,
}: {
  index: number;
  screen: FrameData;
  vh: any;
  gesture?: ScreenGesture;
  redactions: TraceFormData["redactions"][string];
  isActive: boolean;
  onSelect: () => void;
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

  const startX = isDrag ? gesture!.x! * canvasWidth : 0;
  const startY = isDrag ? gesture!.y! * canvasHeight : 0;
  const endX = isDrag
    ? (gesture!.x! + gesture!.scrollDeltaX!) * canvasWidth
    : 0;
  const endY = isDrag
    ? (gesture!.y! + gesture!.scrollDeltaY!) * canvasHeight
    : 0;

  const cardWidthClass = "w-[68%] sm:w-[58%] md:w-[50%] lg:w-[40%] xl:w-[32%]";

  return (
    <figure className={`relative flex flex-col shrink-0 ${cardWidthClass}`}>
      <div className="relative w-full cursor-pointer" ref={containerRef} onClick={onSelect}>
        {/* Screen number */}
        <div className="absolute top-1 right-1 z-20 bg-black/60 text-white text-[10px] font-mono rounded px-1 py-0.5 min-w-[1.25rem] text-center leading-none">
          {index + 1}
        </div>

        <TooltipProvider delayDuration={100}>
          {screen.src.length > 0 ? (
            <ImageWithVH screen={screen} vh={vh} isActive={isActive} />
          ) : (
            <div className={cn(
              "w-full aspect-[9/19] bg-neutral-100 dark:bg-neutral-800 rounded-lg border-2 transition-all duration-150",
              isActive ? "border-neutral-900 dark:border-white" : "border-neutral-200 dark:border-neutral-700",
            )} />
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
                  className="cursor-pointer aspect-square w-[12%] absolute z-20 rounded-full bg-yellow-300 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-85"
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
                ></div>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={10}>
                <p>{redaction.annotation}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {/* Label — always visible */}
      <p className={cn(
        "text-[11px] text-center leading-snug pt-1.5 pb-0.5 px-1 truncate transition-colors duration-150",
        isActive ? "text-neutral-700 dark:text-neutral-200 font-medium" : "text-neutral-400 dark:text-neutral-500",
      )}>
        {gesture?.description ?? "—"}
      </p>
    </figure>
  );
}

const ImageWithVH = ({ screen, vh, isActive }: { screen: FrameData; vh: any; isActive: boolean }) => {
  const { boxes, rootBounds } = useMemo(() => {
    if (!vh) return { boxes: [], rootBounds: null };

    const boxes: any[] = [];
    let rootBounds: any = null;

    function traverse(node: any) {
      if (node.bounds_in_screen) {
        const [left, top, right, bottom] = node.bounds_in_screen
          .split(" ")
          .map(Number);
        const width = right - left;
        const height = bottom - top;
        const x = left;
        const y = top;
        if (!rootBounds) {
          rootBounds = { x, y, width, height };
        }
        if (width <= 0 || height <= 0) {
          return;
        }
        boxes.push({
          x,
          y,
          width,
          height,
          class: node.class_name,
          id: node.id || "null_id",
        });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => traverse(child));
      }
    }
    traverse(vh);
    return { boxes, rootBounds };
  }, [vh]);

  return (
    <div className="relative w-full">
      <Image
        className={cn(
          "relative z-0 w-full h-auto rounded-lg object-contain border-2 transition-all duration-150",
          isActive
            ? "border-neutral-900 dark:border-white shadow-md ring-2 ring-neutral-900/20 dark:ring-white/20 ring-offset-1"
            : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500",
        )}
        src={screen.src}
        alt={screen.id}
        width={0}
        height={0}
        sizes="100vw"
      />
      {rootBounds && (
        <svg
          viewBox={`${rootBounds.x} ${rootBounds.y} ${rootBounds.width} ${rootBounds.height}`}
          preserveAspectRatio="xMinYMin meet"
          className="pointer-events-none top-0 left-0 absolute w-full h-full"
        >
          {boxes.map((box: any, index: number) => (
            <rect
              key={box.id + index}
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              fill={"transparent"}
              stroke="red"
              strokeWidth="1"
            />
          ))}
        </svg>
      )}
    </div>
  );
};
