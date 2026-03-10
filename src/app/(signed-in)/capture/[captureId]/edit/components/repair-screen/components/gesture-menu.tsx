"use client";

import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  createContext,
} from "react";
import { ScreenGesture } from "@prisma/client";

import { CircleDashed } from "lucide-react";
import { motion } from "motion/react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

import clsx from "clsx";
import {
  findGestureOption,
  GestureOption,
  normalizeGestureType,
} from "@/lib/utils/gesture-options";

import {
  GestureAnnotationEditor,
  GestureAnnotationEditorHandle,
} from "./gesture-annotation-editor";
import { GestureSelection } from "./gesture-selection";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";

export const GestureContext = createContext<{
  gesture: ScreenGesture;
  setGesture: React.Dispatch<React.SetStateAction<ScreenGesture>>;
  gestureOptions: GestureOption[];
  canvasSize: { width: number; height: number };
}>({
  gesture: {
    type: null,
    x: null,
    y: null,
    scrollDeltaX: null,
    scrollDeltaY: null,
    description: "",
  },
  setGesture: () => {},
  gestureOptions: [],
  canvasSize: { width: 0, height: 0 },
});

export function GestureMenu({
  position,
  transform,
}: {
  position: { x: number | null; y: number | null };
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null;
}) {
  const ANNOTATION_GAP_PX = 4;
  const editorRef = useRef<GestureAnnotationEditorHandle>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [placeTextareaAbove, setPlaceTextareaAbove] = useState(false);
  const [horizontalOffset, setHorizontalOffset] = useState(0);

  const updatePlacement = useCallback(() => {
    const droppableElement = document.querySelector("[data-droppable]");
    const menuElement = menuRef.current;
    const selectionElement = selectionRef.current;
    const editorElement = editorContainerRef.current;
    if (
      !droppableElement ||
      !menuElement ||
      !selectionElement ||
      !editorElement
    ) {
      return;
    }

    const markerX = (position.x ?? 0) + (transform?.x ?? 0);
    const markerY = (position.y ?? 0) + (transform?.y ?? 0);
    const droppableRect = droppableElement.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();

    const margin = 8;
    const baseLeft = markerX + 16;
    // Keep the annotation menu anchored to the right of the gesture marker.
    // If there is insufficient room near the right edge, allow right overflow
    // rather than shifting the menu left over the marker icon.
    const maxLeft = Math.max(
      margin,
      droppableRect.width - menuRect.width - margin,
    );
    const minLeft = markerX + 12;
    const clampedLeft =
      maxLeft < minLeft
        ? minLeft
        : Math.min(Math.max(baseLeft, minLeft), maxLeft);
    const nextHorizontalOffset = clampedLeft - baseLeft;
    if (Math.abs(nextHorizontalOffset - horizontalOffset) > 0.5) {
      setHorizontalOffset(nextHorizontalOffset);
    }

    const selectionRect = selectionElement.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const totalMenuHeight =
      selectionRect.height + editorRect.height + ANNOTATION_GAP_PX;

    const roomBelow = droppableRect.height - markerY;
    const roomAbove = markerY;
    const shouldPlaceAbove =
      roomBelow < totalMenuHeight + margin && roomAbove > roomBelow;
    if (shouldPlaceAbove !== placeTextareaAbove) {
      setPlaceTextareaAbove(shouldPlaceAbove);
    }
  }, [
    ANNOTATION_GAP_PX,
    horizontalOffset,
    placeTextareaAbove,
    position.x,
    position.y,
    transform?.x,
    transform?.y,
  ]);

  // Determine whether to place the textarea above or below the marker.
  useEffect(() => {
    updatePlacement();
  }, [updatePlacement]);

  useEffect(() => {
    const menuElement = menuRef.current;
    const selectionElement = selectionRef.current;
    const editorElement = editorContainerRef.current;
    if (!menuElement || !selectionElement || !editorElement) {
      return;
    }
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updatePlacement);
      return () => {
        window.removeEventListener("resize", updatePlacement);
      };
    }
    const resizeObserver = new ResizeObserver(() => {
      updatePlacement();
    });
    resizeObserver.observe(menuElement);
    resizeObserver.observe(selectionElement);
    resizeObserver.observe(editorElement);
    window.addEventListener("resize", updatePlacement);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePlacement);
    };
  }, [updatePlacement]);

  // Focus the description field of the gesture annotation editor
  const focusDescriptionField = () => {
    editorRef.current?.focusDescription();
  };

  return (
    <div
      ref={menuRef}
      className="absolute z-50 ml-2"
      style={{
        left: `calc(${position.x ?? 0}px + var(--marker-radius))`,
        top: `calc(${position.y ?? 0}px - var(--marker-radius))`,
        transform: `translate3d(${(transform?.x ?? 0) + horizontalOffset}px, ${
          transform?.y ?? 0
        }px, 0)`,
      }}
    >
      {/* Measure selection row here from ref. Editor overlay is absolutely placed so its out of flow, and does not contribute to parent height. */}
      <div ref={selectionRef} className="relative w-full">
        {placeTextareaAbove && (
          <div
            ref={editorContainerRef}
            className="absolute left-0 w-full"
            style={{ bottom: `calc(100% + ${ANNOTATION_GAP_PX}px)` }}
          >
            <GestureAnnotationEditor ref={editorRef} />
          </div>
        )}

        <GestureSelection
          focusDescriptionField={focusDescriptionField}
          openAbove={placeTextareaAbove}
        />

        {!placeTextareaAbove && (
          <div
            ref={editorContainerRef}
            className="absolute left-0 w-full"
            style={{ top: `calc(100% + ${ANNOTATION_GAP_PX}px)` }}
          >
            <GestureAnnotationEditor ref={editorRef} />
          </div>
        )}
      </div>
    </div>
  );
}

export function DroppableArea({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: "screenshot" });
  return (
    <div ref={setNodeRef} className="relative w-full h-full" data-droppable>
      {children}
    </div>
  );
}

function isDragGesture(type: string | null) {
  return normalizeGestureType(type) === GESTURE_TYPES.DRAG;
}

export function DraggableMarker({
  position,
}: {
  position: { x: number | null; y: number | null };
  props?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const { gesture, canvasSize } = useContext(GestureContext);
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useDraggable({
      id: "gestureMarker",
    });

  const selectedIcon = gesture.type
    ? findGestureOption(gesture.type)?.icon
    : null;
  const showDragPath =
    isDragGesture(gesture.type) &&
    gesture.scrollDeltaX !== null &&
    gesture.scrollDeltaY !== null &&
    position.x !== null &&
    position.y !== null;
  const dragPath =
    showDragPath && position.x !== null && position.y !== null
      ? {
          startX: position.x,
          startY: position.y,
          endX:
            position.x +
            (gesture.scrollDeltaX ?? 0) * Math.max(canvasSize.width, 1),
          endY:
            position.y +
            (gesture.scrollDeltaY ?? 0) * Math.max(canvasSize.height, 1),
        }
      : null;

  return (
    <>
      {dragPath ? (
        <svg
          className="pointer-events-none absolute inset-0 z-45 overflow-visible"
          width="100%"
          height="100%"
        >
          <defs>
            <marker
              id="repair-drag-arrowhead"
              viewBox="0 0 8 8"
              markerWidth="5"
              markerHeight="5"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,8 L8,4 z" fill="rgba(23,23,23,0.7)" />
            </marker>
          </defs>
          <line
            x1={dragPath.startX}
            y1={dragPath.startY}
            x2={dragPath.endX}
            y2={dragPath.endY}
            stroke="rgba(23,23,23,0.65)"
            strokeWidth="1.75"
            markerEnd="url(#repair-drag-arrowhead)"
          />
          <circle
            cx={dragPath.endX}
            cy={dragPath.endY}
            r="4.75"
            fill="white"
            stroke="rgba(23,23,23,0.88)"
            strokeWidth="1.6"
          />
        </svg>
      ) : null}

      <motion.div
        ref={setNodeRef}
        data-marker
        style={{
          left: `calc(${position.x ?? 0}px - var(--marker-radius))`,
          top: `calc(${position.y ?? 0}px - var(--marker-radius))`,
          width: "calc(var(--marker-radius) * 2)",
          height: "calc(var(--marker-radius) * 2)",
          transform: `translate3d(${transform?.x ?? 0}px, ${
            transform?.y ?? 0
          }px, 0)`,
        }}
        className={clsx(
          "absolute z-50 flex justify-center items-center bg-yellow-400/75 hover:bg-yellow-400/100 rounded-full shadow-md transition-colors duration-150 ease-in-out",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        {...listeners}
        {...attributes}
      >
        {selectedIcon ? (
          <span className="inline-flex items-center justify-center w-full h-full">
            {selectedIcon}
          </span>
        ) : (
          <CircleDashed className="size-4 text-yellow-800 hover:text-black" />
        )}
      </motion.div>

      <GestureMenu position={position} transform={transform} />
    </>
  );
}
