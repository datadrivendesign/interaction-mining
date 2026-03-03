"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  RefObject,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { Check, ChevronsUpDown, CircleDashed } from "lucide-react";
import { ScreenGesture } from "@prisma/client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  GestureOption,
  findGestureOption,
  gestureOptions,
  normalizeGestureType,
  POPOVER_CONTENT_CLASS,
  COMMAND_LIST_CLASS,
  COMMAND_ITEM_CLASS,
} from "@/lib/utils/gesture-options";
import { Progress } from "@/components/ui/progress";
import { useNavigation } from "../repair-screen";

import { motion } from "motion/react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import clsx from "clsx";

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
  canvasSize: { width: 1, height: 1 },
});

export function GestureMenu({
  position,
  transform,
}: {
  position: { x: number | null; y: number | null };
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [placeTextareaAbove, setPlaceTextareaAbove] = useState(false);
  const { gesture, setGesture } = useContext(GestureContext);
  const { handleNext } = useNavigation();
  const [annotateLen, setAnnotateLen] = useState(0);
  const maxLength = 50;

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

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleNext();
      }
    },
    [handleNext]
  );

  const handleTextareaChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setGesture((prev) => ({ ...prev, description: value }));
      setAnnotateLen(value.length);
    },
    [setGesture]
  );

  const PLACEHOLDER = "What was your goal with this gesture?";

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
        <div className="absolute mb-1 w-full -top-22">
          {textareaRef.current && (
            <div className="w-full flex flex-col">
              <div className="text-sm flex justify-end text-muted-foreground z-10">
                {`${annotateLen}/${maxLength}`}
              </div>
              <Progress
                className="w-full"
                value={(annotateLen / maxLength) * 100}
              />
            </div>
          )}
          <Textarea
            ref={textareaRef}
            className="text-sm w-full h-full bg-background!"
            placeholder={PLACEHOLDER}
            maxLength={maxLength}
            value={gesture.description ? gesture.description : ""}
            onKeyDown={handleEnter}
            onChange={handleTextareaChange}
          />
        </div>
      )}

      <GestureSelection textareaRef={textareaRef} openAbove={placeTextareaAbove} />

      {!placeTextareaAbove && (
        <div className="absolute mt-1 w-full">
          <Textarea
            ref={textareaRef}
            className="text-sm w-full h-full bg-background!"
            placeholder={PLACEHOLDER}
            maxLength={maxLength}
            value={gesture.description ? gesture.description : ""}
            onKeyDown={handleEnter}
            onChange={handleTextareaChange}
          />
          {textareaRef.current && (
            <div className="w-full flex flex-col">
              <Progress
                className="w-full"
                value={(annotateLen / maxLength) * 100}
              />
              <div className="text-sm flex justify-end text-muted-foreground z-10">
                {`${annotateLen}/${maxLength}`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GestureSelection({
  textareaRef,
  openAbove,
}: {
  textareaRef: RefObject<HTMLTextAreaElement>;
  openAbove: boolean;
}) {
  const { gesture, setGesture } = useContext(GestureContext);
  const [open, setOpen] = useState(gesture.type === null);
  const [value, setValue] = useState<string | null>(normalizeGestureType(gesture.type));
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const dragHelperText =
    gesture.type === "Drag"
      ? gesture.x === null || gesture.y === null
        ? "Click start point"
        : gesture.scrollDeltaX === null || gesture.scrollDeltaY === null
          ? "Click end point"
          : null
      : null;

  useEffect(() => {
    setValue(normalizeGestureType(gesture.type));
  }, [gesture.type]);

  useEffect(() => {
    if (value) {
      setGesture((prev) => ({
        ...prev,
        type: value,
        ...(value === "Drag" && prev.type !== "Drag"
          ? {
              x: null,
              y: null,
              scrollDeltaX: null,
              scrollDeltaY: null,
            }
          : {}),
        ...(value === "Drag"
          ? {}
          : {
              scrollDeltaX:
                value === "Swipe left"
                  ? -0.02
                  : value === "Swipe right"
                    ? 0.02
                    : 0,
              scrollDeltaY:
                value === "Swipe down"
                  ? -0.02
                  : value === "Swipe up"
                    ? 0.02
                    : 0,
            }),
      }));
    } else {
      setGesture((prev) => ({ ...prev, type: null }));
    }
  }, [value, setGesture]);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-50 justify-between"
          >
            {value ? findGestureOption(value)?.label : "Select gesture..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className={POPOVER_CONTENT_CLASS}
          side={openAbove ? "top" : "bottom"}
          align="start"
          sideOffset={4}
          avoidCollisions={false}
        >
          <Command>
            <CommandList className={COMMAND_LIST_CLASS}>
              <CommandEmpty>No gesture found.</CommandEmpty>
              <CommandGroup>
                {gestureOptions.map((option) =>
                  option.subGestures ? (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onMouseEnter={() => setHoveredOption(option.value)}
                      onMouseLeave={() => setHoveredOption(null)}
                      className={cn(COMMAND_ITEM_CLASS, "cursor-pointer")}
                    >
                      <div
                        id={`${option.value}-label`}
                        className={cn(
                          "inline-flex w-full items-center gap-2 transition-transform duration-200",
                          hoveredOption === option.value
                            ? "-translate-x-full"
                            : "translate-x-0"
                        )}
                      >
                        <span className="flex-shrink-0 flex items-center justify-center">
                          {option.icon}
                        </span>
                        <span className="truncate">{option.label}</span>
                      </div>

                      <div
                        id={`${option.value}-sub-gestures`}
                        className={cn(
                          "absolute w-full inset-0 flex justify-center items-center",
                          "transition-transform duration-200",
                          hoveredOption === option.value
                            ? "translate-x-0"
                            : "translate-x-full"
                        )}
                      >
                      {option.subGestures.map((subOption: GestureOption) => (
                          <button
                            key={subOption.value}
                            type="button"
                            className="w-full cursor-pointer"
                            onClick={() => {
                              setValue(subOption.value);
                              setOpen(false);
                              textareaRef.current?.focus();
                            }}
                          >
                            <span className="inline-flex items-center gap-2">
                              {value === subOption.value ? (
                                <Check className={cn("h-4 w-4", "opacity-100")} />
                              ) : (
                                subOption.icon
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </CommandItem>
                  ) : (
                    <React.Fragment key={option.value}>
                      {option.value === "Other" ? (
                        <div className="my-1 h-px bg-border" />
                      ) : null}
                      <CommandItem
                        value={option.value}
                        className={cn(COMMAND_ITEM_CLASS, "cursor-pointer")}
                        onSelect={(currentValue) => {
                          setValue(currentValue === value ? null : currentValue);
                          setOpen(false);
                          textareaRef.current?.focus();
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="flex-shrink-0 flex items-center justify-center">
                            {value === option.value ? (
                              <Check className={cn("h-4 w-4", "opacity-100")} />
                            ) : (
                              option.icon
                            )}
                          </span>
                          <span className="truncate">{option.label}</span>
                        </span>
                      </CommandItem>
                    </React.Fragment>
                  )
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {dragHelperText && (
        <div className="mt-1.5 inline-flex items-center rounded-md border border-black/20 dark:border-white/25 bg-black/85 dark:bg-white/90 px-2 py-1 text-xs font-semibold tracking-wide text-white dark:text-black shadow-sm">
          {dragHelperText}
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

function isDragGesture(type: string | null) {
  return normalizeGestureType(type) === "Drag";
}

export function DraggableMarker({
  position,
}: {
  position: { x: number | null; y: number | null };
  props?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const { gesture, canvasSize } = useContext(GestureContext);

  // Normal marker drag (non-drag gestures)
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useDraggable({ id: "gestureMarker" });

  const selectedIcon =
    gesture.type
      ? findGestureOption(gesture.type)?.icon
      : null;

  const showDragPath = useMemo(() => {
    if (!isDragGesture(gesture.type)) return false;
    return (
      gesture.scrollDeltaX !== null &&
      gesture.scrollDeltaY !== null &&
      position.x !== null &&
      position.y !== null
    );
  }, [gesture.type, gesture.scrollDeltaX, gesture.scrollDeltaY, position.x, position.y]);

  const dragPath = useMemo(() => {
    if (!showDragPath || position.x === null || position.y === null) return null;
    const endX =
      position.x + (gesture.scrollDeltaX ?? 0) * Math.max(canvasSize.width, 1);
    const endY =
      position.y + (gesture.scrollDeltaY ?? 0) * Math.max(canvasSize.height, 1);
    return { startX: position.x, startY: position.y, endX, endY };
  }, [
    showDragPath,
    position.x,
    position.y,
    gesture.scrollDeltaX,
    gesture.scrollDeltaY,
    canvasSize.width,
    canvasSize.height,
  ]);

  // NORMAL MODE
  return (
    <>
      {dragPath && (
        <svg className="absolute inset-0 z-40 pointer-events-none overflow-visible">
          <defs>
            <marker
              id="dragArrowHead"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,7 L7,3.5 z" fill="rgba(23,23,23,0.65)" />
            </marker>
          </defs>
          <line
            x1={dragPath.startX}
            y1={dragPath.startY}
            x2={dragPath.endX}
            y2={dragPath.endY}
            stroke="rgba(23,23,23,0.65)"
            strokeWidth="1.75"
            markerEnd="url(#dragArrowHead)"
          />
          <circle
            cx={dragPath.startX}
            cy={dragPath.startY}
            r="4"
            fill="rgba(23,23,23,0.88)"
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
      )}
      <motion.div
        ref={setNodeRef}
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
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        {...listeners}
        {...attributes}
      >
        {selectedIcon ? (
          <span
            style={{ ["--gesture-accent" as any]: "#111" }}
            className="inline-flex items-center justify-center w-full h-full"
          >
            {selectedIcon}
          </span>
        ) : (
          <CircleDashed className="size-5 text-black" />
        )}
      </motion.div>

      <GestureMenu position={position} transform={transform} />
    </>
  );
}
