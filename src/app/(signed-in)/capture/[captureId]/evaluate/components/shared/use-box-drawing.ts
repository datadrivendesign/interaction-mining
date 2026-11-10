"use client";

import { PointerEvent as ReactPointerEvent, useState } from "react";

/** A point on the screenshot, as fractions of its width and height. */
export type Point = { x: number; y: number };
export type BoxRect = { x: number; y: number; width: number; height: number };

/** Boxes smaller than this (fraction of the screen) are treated as a click. */
const MIN_BOX_FRACTION = 0.01;

function rectBetween(a: Point, b: Point): BoxRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

/**
 * Drawing a redaction box by dragging on the screenshot. `start` captures
 * the pointer, so the drag keeps going if it leaves the image. `onBoxDrawn`
 * gets the box on release, unless it is too small to be one.
 */
export function useBoxDrawing(onBoxDrawn: (rect: BoxRect) => void) {
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<Point | null>(null);

  const start = (event: ReactPointerEvent, point: Point) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrawStart(point);
    setDrawCurrent(point);
  };
  const move = (point: Point) => {
    if (drawStart) setDrawCurrent(point);
  };
  const cancel = () => {
    setDrawStart(null);
    setDrawCurrent(null);
  };
  const finish = () => {
    if (!drawStart || !drawCurrent) return;
    const rect = rectBetween(drawStart, drawCurrent);
    cancel();
    if (rect.width < MIN_BOX_FRACTION || rect.height < MIN_BOX_FRACTION) {
      return;
    }
    onBoxDrawn(rect);
  };

  return {
    isDrawing: drawStart !== null,
    /** The box being drawn, for the dashed preview. */
    draftBox:
      drawStart && drawCurrent ? rectBetween(drawStart, drawCurrent) : null,
    start,
    move,
    finish,
    cancel,
  };
}
