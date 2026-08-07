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
import { Check } from "lucide-react";
import Image from "next/image";
import { FrameData, TraceFormData } from "../../../edit/components/types";
import { useEffect, useMemo, useRef } from "react";
import { useMeasure } from "@uidotdev/usehooks";
import type { ScreenGesture } from "@prisma/client";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";
import { cn } from "@/lib/utils";
import { ScreenComment } from "../shared/screen-comments-panel";

export function ReviewGalleryAndroid({
  traceData,
  activeScreenId,
  commentsByScreen,
  onScreenSelect,
  captureTimestamp,
  selectedScreenIds,
  onSelectedScreenToggle,
}: {
  traceData: TraceFormData;
  activeScreenId: string | null;
  commentsByScreen: Record<string, ScreenComment[]>;
  onScreenSelect: (id: string) => void;
  captureTimestamp?: string | null;
  selectedScreenIds?: string[];
  onSelectedScreenToggle?: (screenId: string, checked: boolean) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const sortedScreens = [...traceData.screens].sort(
    (a, b) => a.timestamp - b.timestamp,
  );
  const screensWithIssues = sortedScreens.filter(
    (screen) => (commentsByScreen[screen.id]?.length ?? 0) > 0,
  ).length;

  useEffect(() => {
    if (!activeScreenId) {
      return;
    }

    const container = scrollContainerRef.current;
    const activeCard = cardRefs.current[activeScreenId];
    if (!container || !activeCard) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const cardRect = activeCard.getBoundingClientRect();
    const isVisible =
      cardRect.left >= containerRect.left &&
      cardRect.right <= containerRect.right;

    if (!isVisible) {
      activeCard.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeScreenId]);

  return (
    <section className="flex h-full w-full flex-col">
      {/* Description strip — matches panel header style */}
      <div className="flex h-9 flex-shrink-0 items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 dark:border-neutral-800 dark:bg-neutral-950">
        <span className="shrink-0 text-[10px] font-medium tracking-widest text-neutral-400 uppercase dark:text-neutral-600">
          Gallery
        </span>
        <p className="truncate text-xs text-neutral-600 dark:text-neutral-400">
          {sortedScreens.length} screen{sortedScreens.length === 1 ? "" : "s"}
          {screensWithIssues > 0 ? ` • ${screensWithIssues} flagged` : ""}
          {captureTimestamp ? ` • Created ${captureTimestamp}` : ""}
        </p>
      </div>

      {/* Scroll area */}
      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 touch-auto overflow-x-auto overflow-y-hidden px-4 pt-4 pb-3"
      >
        <div className="flex h-full items-start gap-3 pb-1">
          {sortedScreens.map((screen, index) => (
            <ReviewFigureAndroid
              key={screen.id}
              cardRef={(node) => {
                cardRefs.current[screen.id] = node;
              }}
              index={index}
              screen={screen}
              vh={traceData.vhs?.[screen.id]}
              gesture={traceData.gestures[screen.id]}
              redactions={traceData.redactions[screen.id] || []}
              isActive={screen.id === activeScreenId}
              issueCount={commentsByScreen[screen.id]?.length ?? 0}
              onSelect={() => onScreenSelect(screen.id)}
              isSelected={selectedScreenIds?.includes(screen.id) ?? false}
              onSelectedToggle={
                onSelectedScreenToggle
                  ? (checked) => onSelectedScreenToggle(screen.id, checked)
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewFigureAndroid({
  cardRef,
  index,
  screen,
  vh,
  gesture,
  redactions,
  isActive,
  issueCount,
  onSelect,
  isSelected,
  onSelectedToggle,
}: {
  cardRef?: (node: HTMLElement | null) => void;
  index: number;
  screen: FrameData;
  vh: any;
  gesture?: ScreenGesture;
  redactions: TraceFormData["redactions"][string];
  isActive: boolean;
  issueCount: number;
  onSelect: () => void;
  isSelected?: boolean;
  onSelectedToggle?: (checked: boolean) => void;
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
  const hasIssues = issueCount > 0;
  const borderClass = isActive
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
    <figure
      ref={cardRef}
      className={`relative flex shrink-0 flex-col ${cardWidthClass}`}
    >
      <div
        className="relative w-full cursor-pointer"
        ref={containerRef}
        onClick={onSelect}
      >
        {hasIssues && (
          <div className="absolute top-1 left-1 z-20 min-w-[1.25rem] rounded-full bg-red-500 px-1 py-0.5 text-center font-mono text-[10px] leading-none text-white shadow-sm">
            {issueCount}
          </div>
        )}

        {/* Screen number */}
        <div className="absolute top-1 right-1 z-20 min-w-[1.25rem] rounded bg-black/60 px-1 py-0.5 text-center font-mono text-[10px] leading-none text-white">
          {index + 1}
        </div>

        {/* Selection checkbox overlay */}
        {onSelectedToggle !== undefined && (
          <button
            type="button"
            aria-label={
              isSelected
                ? `Deselect screen ${index + 1}`
                : `Select screen ${index + 1}`
            }
            className="absolute bottom-1 left-1 z-30 flex size-5 items-center justify-center rounded border-2 shadow-sm transition-colors"
            style={{
              background: isSelected
                ? "rgb(124 58 237)"
                : "rgba(255,255,255,0.9)",
              borderColor: isSelected ? "rgb(124 58 237)" : "rgb(163 163 163)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectedToggle(!isSelected);
            }}
          >
            {isSelected && (
              <Check className="size-3 text-white" strokeWidth={3} />
            )}
          </button>
        )}

        <TooltipProvider delayDuration={100}>
          {screen.src.length > 0 ? (
            <ImageWithVH screen={screen} vh={vh} borderClass={borderClass} />
          ) : (
            <div
              className={cn(
                "aspect-[9/19] w-full rounded-lg border-2 bg-neutral-100 transition-all duration-150 dark:bg-neutral-800",
                placeholderBorderClass,
              )}
            />
          )}

          {isDrag && (
            <svg
              className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
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
                  className="absolute z-20 flex aspect-square w-[12%] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-yellow-300 opacity-85"
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
                  className="absolute z-15 cursor-pointer border-1 border-yellow-500 bg-black hover:shadow-lg hover:shadow-yellow-500/50"
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
      <p
        className={cn(
          "truncate px-1 pt-1.5 pb-0.5 text-center text-xs leading-snug transition-colors duration-150",
          isActive
            ? "font-medium text-neutral-900 dark:text-neutral-400"
            : "text-neutral-600 dark:text-neutral-600",
        )}
      >
        {gesture?.description ?? "—"}
      </p>
    </figure>
  );
}

const ImageWithVH = ({
  screen,
  vh,
  borderClass,
}: {
  screen: FrameData;
  vh: any;
  borderClass: string;
}) => {
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
          "relative z-0 h-auto w-full rounded-lg border-2 object-contain transition-all duration-150",
          borderClass,
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
          className="pointer-events-none absolute top-0 left-0 h-full w-full"
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
