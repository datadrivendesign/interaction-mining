"use client";

import type { ReactNode } from "react";
import type { ScreenGesture } from "@prisma/client";
import { Check, Maximize2 } from "lucide-react";
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

export type ScreenCardSize = "S" | "M" | "L";
export const SCREEN_CARD_SIZES: readonly ScreenCardSize[] = ["S", "M", "L"];
export const DEFAULT_SCREEN_CARD_SIZE: ScreenCardSize = "M";

/** Card widths per size; landscape screens are twice as wide. */
const CARD_WIDTH_CLASS: Record<
  ScreenCardSize,
  { portrait: string; landscape: string }
> = {
  S: { portrait: "w-40", landscape: "w-80" },
  M: { portrait: "w-52", landscape: "w-[26rem]" },
  L: { portrait: "w-72", landscape: "w-[36rem]" },
};

/**
 * Gesture icon size: a share of the screenshot's shorter side, so it grows
 * with the S/M/L card size and a landscape screen gets the same icon as a
 * portrait one. Only the grid cards use this; the full-size viewer draws
 * its own marker.
 */
const ICON_MIN_PX = 10;
const ICON_MAX_PX = 33;
const ICON_SIZE_RATIO = 0.1125;
/** The yellow ring sits just outside the icon. */
const RING_PER_ICON = 1.05;
/** The gesture icons render at 24 px; they are scaled to the icon size. */
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
  size = DEFAULT_SCREEN_CARD_SIZE,
  isFixed = false,
  renderImage,
  onEnlarge,
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
  size?: ScreenCardSize;
  /** A reviewer fixed this screen while it was open. */
  isFixed?: boolean;
  /** Draws the screenshot with the given border classes. */
  renderImage: (borderClass: string) => ReactNode;
  /** Opens the screen at full height, for reading text and checking privacy. */
  onEnlarge?: () => void;
  onSelect: () => void;
  isSelected?: boolean;
  onSelectedToggle?: (checked: boolean) => void;
  /** Extra controls under the description (the Fix button). */
  footer?: ReactNode;
}) {
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
        CARD_WIDTH_CLASS[size][isLandscape ? "landscape" : "portrait"],
      )}
    >
      <div
        className="group/card relative w-full cursor-pointer"
        onClick={onSelect}
        onDoubleClick={onEnlarge}
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

        {onEnlarge && (
          <button
            type="button"
            aria-label={`Enlarge screen ${index + 1}`}
            title="Enlarge (or double-click the screen)"
            className="absolute bottom-1 left-1/2 z-30 flex size-6 -translate-x-1/2 items-center justify-center rounded-full bg-neutral-900/80 text-white opacity-0 shadow-sm transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              onEnlarge();
            }}
          >
            <Maximize2 className="size-3.5" />
          </button>
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

        {renderImage(borderClass)}
        <ScreenOverlays
          screenId={screenId}
          gesture={gesture}
          redactions={redactions}
        />
      </div>

      <ScreenDescription
        gesture={gesture}
        isLastScreen={isLastScreen}
        className={cn(
          "px-0.5 leading-relaxed break-words",
          size === "S" ? "text-[13px]" : "text-sm",
          isActive
            ? "text-neutral-950 dark:text-white"
            : "text-neutral-800 dark:text-neutral-200",
        )}
      />
      {footer}
    </figure>
  );
}

/**
 * The gesture marker, drag arrow, and redaction boxes, drawn over a
 * screenshot. Place it inside a `relative` box the same size as the image.
 */
export function ScreenOverlays({
  screenId,
  gesture,
  redactions,
}: {
  screenId: string;
  gesture?: ScreenGesture;
  redactions: Redaction[];
}) {
  const [containerRef, { width, height }] = useMeasure();
  const canvasWidth = width ?? 0;
  const canvasHeight = height ?? 0;
  const iconPx = Math.min(
    ICON_MAX_PX,
    Math.max(
      ICON_MIN_PX,
      Math.min(canvasWidth, canvasHeight) * ICON_SIZE_RATIO,
    ),
  );
  const ringPx = Math.round(iconPx * RING_PER_ICON);
  // The drag arrow scales with the icon (2 px line and 5 px dot at 24 px).
  const dragStroke = Math.max(1.5, iconPx / 12);
  const dragDotRadius = Math.max(4, iconPx * 0.21);

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

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <TooltipProvider delayDuration={100}>
        {isDrag && (
          <svg
            className="absolute inset-0 z-10 h-full w-full overflow-visible"
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
              strokeWidth={dragStroke}
              markerEnd={`url(#dragArrowHead-${screenId})`}
            />
            <circle
              cx={endX}
              cy={endY}
              r={dragDotRadius}
              fill="white"
              stroke="rgba(23,23,23,0.92)"
              strokeWidth={dragStroke * 0.9}
            />
          </svg>
        )}

        {gesture?.type && gesture.x !== null && gesture.y !== null && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="pointer-events-auto absolute z-20 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-yellow-300 opacity-85 ring-1 ring-yellow-600/60"
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
                    transform: `scale(${iconPx / ICON_NATIVE_PX})`,
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
                className="pointer-events-auto absolute z-15 cursor-pointer border-1 border-yellow-500 bg-black hover:shadow-lg hover:shadow-yellow-500/50"
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
  );
}
