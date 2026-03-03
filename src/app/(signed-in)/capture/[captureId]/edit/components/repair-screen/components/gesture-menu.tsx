"use client";

import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  createContext,
} from "react";
import { ScreenGesture } from "@prisma/client";

import { CircleDashed } from "lucide-react";
import { motion } from "motion/react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

import clsx from "clsx";
import { GestureOption } from "@/lib/utils/gesture-options";

import {
  GestureAnnotationEditor,
  GestureAnnotationEditorHandle,
} from "./gesture-annotation-editor";
import { GestureSelection } from "./gesture-selection";

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
  const editorRef = useRef<GestureAnnotationEditorHandle>(null);
  const [placeTextareaAbove, setPlaceTextareaAbove] = useState(false);

  // Determine whether to place the textarea above or below the marker
  useEffect(() => {
    const droppableElement = document.querySelector("[data-droppable]");
    const droppableRect = droppableElement?.getBoundingClientRect();
    const shouldPlaceAbove =
      (droppableRect &&
        position.y !== null &&
        position.y > droppableRect.height * 0.8) ||
      false;
    if (shouldPlaceAbove !== placeTextareaAbove) {
      setPlaceTextareaAbove(shouldPlaceAbove);
    }
  }, [position, placeTextareaAbove]);

  // Focus the description field of the gesture annotation editor
  const focusDescriptionField = () => {
    editorRef.current?.focusDescription();
  };

  return (
    <div
      className="absolute z-50 ml-2"
      style={{
        left: `calc(${position.x ?? 0}px + var(--marker-radius))`,
        top: `calc(${position.y ?? 0}px - var(--marker-radius))`,
        transform: `translate3d(${transform?.x ?? 0}px, ${
          transform?.y ?? 0
        }px, 0)`,
      }}
    >
      {placeTextareaAbove && (
        <div
          className="absolute w-full"
          style={{ top: 0, transform: "translateY(calc(-100% - 0.25rem))" }}
        >
          <GestureAnnotationEditor ref={editorRef} />
        </div>
      )}

      <GestureSelection
        focusDescriptionField={focusDescriptionField}
        openAbove={placeTextareaAbove}
      />

      {!placeTextareaAbove && (
        <div className="absolute mt-1 w-full">
          <GestureAnnotationEditor ref={editorRef} />
        </div>
      )}
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

export function DraggableMarker({
  position,
}: {
  position: { x: number | null; y: number | null };
  props?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useDraggable({
      id: "gestureMarker",
    });

  const { gesture, gestureOptions } = useContext(GestureContext);

  return (
    <>
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
        {gesture.type ? (
          gestureOptions
            .flatMap((gesture) => [gesture, ...(gesture.subGestures ?? [])])
            .find((option) => option.value === gesture.type)?.icon
        ) : (
          <CircleDashed className="size-4 text-yellow-800 hover:text-black" />
        )}
      </motion.div>

      <GestureMenu position={position} transform={transform} />
    </>
  );
}
