"use client";

import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useMeasure, useMouse } from "@uidotdev/usehooks";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { ScreenGesture } from "@prisma/client";

import mergeRefs from "@/lib/utils/merge-refs";
import { FrameData } from "../../../types";
import { GestureOption } from "@/lib/utils/gesture-options";
import {
  DraggableMarker,
  DroppableArea,
  GestureContext,
} from "../gesture-menu";

export default function RepairScreenCanvasIOS({
  screen,
  gesture,
  setGesture,
  gestureOptions,
  isLastScreen,
}: {
  screen: FrameData;
  gesture: ScreenGesture;
  setGesture: React.Dispatch<React.SetStateAction<ScreenGesture>>;
  gestureOptions: GestureOption[];
  isLastScreen: boolean;
}) {
  const [imageRef, { width, height }] = useMeasure();
  const [mouse, ref] = useMouse();
  const mergedRef = useMemo(() => {
    return mergeRefs(ref, imageRef);
  }, [ref, imageRef]);

  // memoize gesture and setGesture to avoid unnecessary re-renders
  const memoizedGestureState = useMemo(() => {
    return { gesture, setGesture };
  }, [gesture, setGesture]);
  const [tooltip, setTooltip] = useState<{
    x: number | null;
    y: number | null;
  }>({
    x: null,
    y: null,
  });
  const [markerPixelPosition, setMarkerPixelPosition] = useState<{
    x: number | null;
    y: number | null;
  }>({
    x: null,
    y: null,
  });

  // Set initial marker position on image
  const handleImageClick = () => {
    // if last screen, disable gesture setting
    if (isLastScreen) {
      return;
    }
    if (width && height) {
      const relativeX = mouse.elementX / width;
      const relativeY = mouse.elementY / height;

      setGesture((prev) => {
        if (prev.type === "Drag") {
          const hasStart = prev.x !== null && prev.y !== null;
          const hasEnd = prev.scrollDeltaX !== null && prev.scrollDeltaY !== null;

          if (!hasStart || hasEnd) {
            return {
              ...prev,
              x: relativeX,
              y: relativeY,
              scrollDeltaX: null,
              scrollDeltaY: null,
            };
          }
          const startX = prev.x ?? relativeX;
          const startY = prev.y ?? relativeY;

          return {
            ...prev,
            scrollDeltaX: relativeX - startX,
            scrollDeltaY: relativeY - startY,
          };
        }

        return {
          ...prev,
          x: relativeX,
          y: relativeY,
        };
      });
    }
  };

  // Update marker position on drag
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const imageElement = ref.current;
      if (imageElement && width && height) {
        const { delta } = event;
        // Calculate proportional delta
        const deltaX = delta.x / width;
        const deltaY = delta.y / height;
        setGesture((prev) => ({
          ...prev,
          x: prev.x! + deltaX,
          y: prev.y! + deltaY,
        }));
      }
    },
    [ref, width, height, setGesture]
  );

  useEffect(() => {
    const { x: markerX, y: markerY } = markerPixelPosition;
    const { x: gestureX, y: gestureY } = gesture;
    if (
      width &&
      height &&
      gestureX &&
      gestureY &&
      (markerX !== gestureX * width || markerY !== gestureY * height)
    ) {
      setMarkerPixelPosition({
        x: gestureX ? gestureX * width : null,
        y: gestureY ? gestureY * height : null,
      });
    }
  }, [gesture, markerPixelPosition, width, height]);

  return (
    <>
      <GestureContext.Provider
        value={{
          gesture: memoizedGestureState["gesture"],
          setGesture: memoizedGestureState["setGesture"],
          gestureOptions: gestureOptions,
          canvasSize: { width: width ?? 1, height: height ?? 1 },
        }}
      >
        <DndContext
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <div className="flex justify-center items-center w-full h-full bg-neutral-50 dark:bg-neutral-950 p-4">
            <div
              className="relative w-fit inline-flex h-full"
              style={{ "--marker-radius": "1rem" } as React.CSSProperties}
            >
              <DroppableArea>
                <AnimatePresence>
                  {/* Only show floating tooltip when no marker is placed  */}
                  {tooltip!.x &&
                  tooltip!.y &&
                  !gesture.x &&
                  !gesture.y &&
                  !isLastScreen ? (
                    <motion.div
                      className="absolute z-50 px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded-md shadow-md pointer-events-none origin-left"
                      initial={{
                        x: 8 + tooltip!.x,
                        y: 8 + tooltip!.y,
                        opacity: 0,
                      }}
                      animate={{
                        x: 8 + tooltip!.x,
                        y: 8 + tooltip!.y,
                        opacity: 1,
                      }}
                      exit={{
                        x: 8 + tooltip!.x,
                        y: 8 + tooltip!.y,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.05 }}
                    >
                      <span className="text-xs font-medium">Add a gesture</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                {markerPixelPosition.x !== null &&
                markerPixelPosition.y !== null ? (
                  <DraggableMarker position={markerPixelPosition} />
                ) : null}
                <Image
                  ref={mergedRef as MutableRefObject<HTMLImageElement | null>}
                  src={screen.src}
                  alt="gallery"
                  draggable={false}
                  className={`${isLastScreen ? "cursor-default" : "cursor-crosshair "} w-auto h-full rounded-lg select-none`}
                  width={0}
                  height={0}
                  sizes="100vw"
                  onClick={handleImageClick}
                  onMouseMove={() => {
                    setTooltip({ x: mouse.elementX, y: mouse.elementY });
                  }}
                  onMouseLeave={() => {
                    setTooltip({ x: null, y: null });
                  }}
                />
              </DroppableArea>
            </div>
          </div>
        </DndContext>
      </GestureContext.Provider>
    </>
  );
}
