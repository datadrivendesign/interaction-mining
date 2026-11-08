"use client";

import type { ReactNode } from "react";
import type { ScreenGesture } from "@prisma/client";
import { Check } from "lucide-react";
import { useMeasure } from "@uidotdev/usehooks";
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
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";
import { cn } from "@/lib/utils";
import { Redaction } from "../../../edit/components/types";
import { ScreenDescription } from "./screen-description";

/** Card width in the gallery grid; landscape screens take two columns. */
export const SCREEN_CARD_WIDTH_CLASS = "w-40";
const LANDSCAPE_CARD_WIDTH_CLASS = "w-80";

/** Gesture ring diameter: scales with the screenshot, never below 14 px. */
const RING_MIN_PX = 14;
const RING_MAX_PX = 32;
const RING_WIDTH_RATIO = 0.13;
/** The gesture icons render at 24 px; the ring shrinks them to fit. */
const ICON_NATIVE_PX = 24;

/**
 * One screen in the review gallery: the screenshot (passed in, since iOS and
 * Android draw it differently), its gesture and redactions on top, badges for
 * the screen number, notes and fixes, and the full description under it.
 */
export function ReviewScreenCard({
  cardRef,
  index,
  screenId,
  gesture,
  redactions,
  isActive,
  isLastScreen,
  issueCount,
  isLandscape = false,
  isFixed = false,
  renderImage,
  onSelect,
  isSelected = false,
  onSelectedToggle,
  footer,
}: {
  cardRef?: (node: HTMLElement | null) => void;
  index: number;
  screenId: string;
  gesture?: ScreenGesture;
  redactions: Redaction[];
  isActive: boolean;
  isLastScreen: boolean;
  issueCount: number;
  isLandscape?: boolean;
  /** A reviewer fixed this screen while it was open. */
  isFixed?: boolean;
  /** Draws the screenshot with the given border classes. */
  renderImage: (borderClass: string) => ReactNode;
  onSelect: () => void;
  isSelected?: boolean;
  onSelectedToggle?: (checked: boolean) => void;
  /** Extra controls under the description (the Fix button). */
  footer?: ReactNode;
}) {
  const [containerRef, { width, height }] = useMeasure();
  const canvasWidth = width ?? 0;
  const canvasHeight = height ?? 0;
  const ringPx = Math.round(
    Math.min(
      RING_MAX_PX,
      Math.max(RING_MIN_PX, canvasWidth * RING_WIDTH_RATIO),
    ),
  );

  const isDrag =
    !!gesture &&
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

  const hasIssues = issueCount > 0;
  const borderClass = isActive
    ? hasIssues
      ? "border-red-500 dark:border-red-400 shadow-md ring-2 ring-red-500/20 dark:ring-red-400/20 ring-offset-1"
      : "border-neutral-900 dark:border-white shadow-md ring-2 ring-neutral-900/20 dark:ring-white/20 ring-offset-1"
    : hasIssues
      ? "border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600"
      : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 dark:hover:border-neutral-500";

  return (
    <figure
      ref={cardRef}
      data-screen-id={screenId}
      className={cn(
        "relative flex shrink-0 flex-col gap-1.5",
        isLandscape ? LANDSCAPE_CARD_WIDTH_CLASS : SCREEN_CARD_WIDTH_CLASS,
      )}
    >
      <div
        className="relative w-full cursor-pointer"
        onClick={onSelect}
        ref={containerRef}
      >
        {hasIssues && (
          <div
            className="absolute top-1 left-1 z-20 min-w-[1.25rem] rounded-full bg-red-500 px-1 py-0.5 text-center font-mono text-[10px] leading-none text-white shadow-sm"
            title={`${issueCount} note${issueCount === 1 ? "" : "s"} for the worker`}
          >
            {issueCount}
          </div>
        )}

        <div className="absolute top-1 right-1 z-20 min-w-[1.25rem] rounded-full bg-neutral-900 px-1.5 py-0.5 text-center text-[11px] leading-none font-bold text-white dark:bg-white dark:text-neutral-900">
          {index + 1}
        </div>

        {isFixed && (
          <div className="absolute bottom-1 left-1 z-20 rounded-full bg-green-600 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white shadow-sm">
            Fixed
          </div>
        )}

        {onSelectedToggle !== undefined && (
          <button
            type="button"
            aria-label={
              isSelected
                ? `Deselect screen ${index + 1}`
                : `Select screen ${index + 1}`
            }
            className={cn(
              "absolute right-1 bottom-1 z-30 flex size-5 items-center justify-center rounded border-2 shadow-sm transition-colors",
              isSelected
                ? "border-violet-600 bg-violet-600"
                : "border-neutral-400 bg-white/90",
            )}
            onClick={(event) => {
              event.stopPropagation();
              onSelectedToggle(!isSelected);
            }}
          >
            {isSelected && (
              <Check className="size-3 text-white" strokeWidth={3} />
            )}
          </button>
        )}

        <TooltipProvider delayDuration={100}>
          {renderImage(borderClass)}

          {isDrag && (
            <svg
              className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
              width="100%"
              height="100%"
            >
              <defs>
                <marker
                  id={`dragArrowHead-${screenId}`}
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
                markerEnd={`url(#dragArrowHead-${screenId})`}
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

          {gesture?.type && gesture.x !== null && gesture.y !== null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-yellow-300 opacity-85 ring-1 ring-yellow-600/60"
                  style={{
                    left: `${gesture.x * 100}%`,
                    top: `${gesture.y * 100}%`,
                    width: ringPx,
                    height: ringPx,
                  }}
                >
                  <span
                    className="flex items-center justify-center"
                    style={{
                      transform: `scale(${(ringPx * 0.75) / ICON_NATIVE_PX})`,
                    }}
                  >
                    {findGestureOption(gesture.type)?.icon}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={5} className="z-50">
                <p>{gesture.type}</p>
              </TooltipContent>
            </Tooltip>
          )}

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
                />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={10}>
                <p>{redaction.annotation}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      <ScreenDescription
        gesture={gesture}
        isLastScreen={isLastScreen}
        className={cn(
          "px-0.5 text-[13px] leading-relaxed break-words",
          isActive
            ? "text-neutral-950 dark:text-white"
            : "text-neutral-800 dark:text-neutral-200",
        )}
      />
      {footer}
    </figure>
  );
}
