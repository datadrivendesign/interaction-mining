"use client";

import type { ReactNode } from "react";
import type { ScreenGesture } from "@prisma/client";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findGestureOption } from "@/lib/utils/gesture-options";
import { cn } from "@/lib/utils";
import { Redaction } from "../../../edit/components/types";
import { ScreenDescription } from "./screen-description";
import type { Point } from "./use-box-drawing";

// Presentational pieces of the screen viewer.

/** What the screen shows now: its description, gesture type and boxes. */
export function ViewPanel({
  gesture,
  isLastScreen,
  boxes,
  seeUnderBoxes,
  onSeeUnderBoxesChange,
  canEdit,
}: {
  gesture: ScreenGesture | null;
  isLastScreen: boolean;
  boxes: Redaction[];
  seeUnderBoxes: boolean;
  onSeeUnderBoxesChange: (checked: boolean) => void;
  canEdit: boolean;
}) {
  return (
    <>
      <section className="flex flex-col gap-1">
        <h3 className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Description
        </h3>
        <ScreenDescription
          gesture={gesture}
          isLastScreen={isLastScreen}
          className="text-sm leading-relaxed"
        />
        {gesture?.type && (
          <p className="text-xs text-neutral-500">
            Gesture: {findGestureOption(gesture.type)?.label ?? gesture.type}
          </p>
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Redaction boxes ({boxes.length})
        </h3>
        {boxes.length === 0 ? (
          <p className="text-sm text-neutral-500 italic">None</p>
        ) : (
          <>
            <ol className="flex flex-col gap-0.5 text-sm">
              {boxes.map((box, index) => (
                <li key={box.id}>
                  <span className="mr-1.5 font-bold">{index + 1}.</span>
                  {box.annotation.trim() || (
                    <span className="text-red-600 italic">No note</span>
                  )}
                </li>
              ))}
            </ol>
            <SeeUnderBoxesToggle
              checked={seeUnderBoxes}
              onChange={onSeeUnderBoxesChange}
            />
          </>
        )}
      </section>
      {canEdit && (
        <p className="text-xs text-neutral-500">
          To fix this screen, open the Gesture or Redaction tab.
        </p>
      )}
    </>
  );
}

export function SeeUnderBoxesToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-neutral-600 select-none dark:text-neutral-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      See under boxes
    </label>
  );
}

export function ScreenArrow({
  side,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      aria-label={side === "left" ? "Previous screen" : "Next screen"}
      title={side === "left" ? "Previous screen (←)" : "Next screen (→)"}
      disabled={disabled}
      onClick={onClick}
      // Beside the screenshot, not over it, so clicks near its edges reach
      // the canvas.
      className="shrink-0 rounded-full shadow-md"
    >
      <Icon className="size-5" />
    </Button>
  );
}

/** A numbered step in the Gesture panel, ticked when done. */
export function Step({
  number,
  title,
  done,
  disabled = false,
  children,
}: {
  number: number;
  title: string;
  done: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex flex-col gap-2", disabled && "opacity-60")}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full text-[11px]",
            done
              ? "bg-green-600 text-white"
              : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
          )}
        >
          {done ? <Check className="size-3" strokeWidth={3} /> : number}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** The gesture marker (and drag arrow) on the canvas. */
export function GestureMarks({
  type,
  start,
  end,
}: {
  type: string;
  start: Point;
  end: Point | null;
}) {
  return (
    <>
      {end && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line
            x1={start.x * 100}
            y1={start.y * 100}
            x2={end.x * 100}
            y2={end.y * 100}
            stroke="rgba(37,99,235,0.9)"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {end && (
        <span
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow"
          style={{ left: `${end.x * 100}%`, top: `${end.y * 100}%` }}
        />
      )}
      <span
        className="pointer-events-none absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-300 opacity-90 ring-2 ring-yellow-600/70"
        style={{ left: `${start.x * 100}%`, top: `${start.y * 100}%` }}
      >
        {findGestureOption(type)?.icon}
      </span>
    </>
  );
}
