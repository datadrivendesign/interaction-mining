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
  gestureOptions,
  POPOVER_CONTENT_CLASS,
  COMMAND_LIST_CLASS,
  COMMAND_ITEM_CLASS,
} from "@/lib/utils/gesture-options";
import { Progress } from "@/components/ui/progress";
import { useNavigation } from "../repair-screen";

import { motion } from "motion/react";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import clsx from "clsx";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const GestureContext = createContext<{
  gesture: ScreenGesture;
  setGesture: React.Dispatch<React.SetStateAction<ScreenGesture>>;
  gestureOptions: GestureOption[];
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

      <GestureSelection textareaRef={textareaRef} />

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
}: {
  textareaRef: RefObject<HTMLTextAreaElement>;
}) {
  const { gesture, setGesture } = useContext(GestureContext);
  const [open, setOpen] = useState(gesture.type === null);
  const [value, setValue] = useState(gesture.type);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  useEffect(() => {
    if (value !== "") {
      setGesture((prev) => ({
        ...prev,
        type: value,
        scrollDeltaX:
          value === "Swipe left" ? -0.02 : value === "Swipe right" ? 0.02 : 0,
        scrollDeltaY:
          value === "Swipe down" ? -0.02 : value === "Swipe up" ? 0.02 : 0,
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
            {value
              ? gestureOptions
                  .flat()
                  .flatMap((option) => [option, ...(option.subGestures ?? [])])
                  .find((option) => option.value === value)?.label
              : "Select gesture..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className={POPOVER_CONTENT_CLASS}>
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
                      className={COMMAND_ITEM_CLASS}
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
                          "absolute inset-0 flex items-center justify-end pr-2",
                          "transition-transform duration-200",
                          hoveredOption === option.value
                            ? "translate-x-0"
                            : "translate-x-full"
                        )}
                      >
                        <TooltipProvider delayDuration={80}>
                          <div className="flex flex-row items-center gap-1">
                            {option.subGestures.map((subOption: GestureOption) => (
                              <Tooltip key={subOption.value}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className={cn(
                                      "inline-flex items-center justify-center",
                                      "w-10 h-10 rounded-md",
                                      "hover:bg-accent/40 transition-colors"
                                    )}
                                    onClick={() => {
                                      setValue(subOption.value);
                                      setOpen(false);
                                      textareaRef.current?.focus();
                                    }}
                                  >
                                    <span className="inline-flex items-center justify-center">
                                      {subOption.icon}
                                    </span>
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                  {subOption.label}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </TooltipProvider>
                      </div>
                    </CommandItem>
                  ) : (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      className={COMMAND_ITEM_CLASS}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue);
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
                  )
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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
  if (!type) return false;
  const t = type.trim().toLowerCase();
  return t === "drag" || t.startsWith("drag ");
}

function DraggableEndpoint({
  id,
  label,
  x,
  y,
}: {
  id: string;
  label: "Start" | "End";
  x: number;
  y: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        left: `calc(${x}px - var(--marker-radius))`,
        top: `calc(${y}px - var(--marker-radius))`,
        width: "calc(var(--marker-radius) * 2)",
        height: "calc(var(--marker-radius) * 2)",
        transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0)`,
      }}
      className={clsx(
        "absolute z-50 flex justify-center items-center bg-yellow-400/75 hover:bg-yellow-400/100 rounded-full shadow-md transition-colors duration-150 ease-in-out",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      {...listeners}
      {...attributes}
    >
      <span className="font-semibold text-black text-[10px] leading-none select-none px-1 text-center">
        {label}
      </span>
    </motion.div>
  );
}

/**
 * Start endpoint + menu that follows Start's transform (same smoothness as Tap marker)
 */
function DragStartWithMenu({
  start,
}: {
  start: { x: number; y: number };
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: "dragStart" });

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={{
          left: `calc(${start.x}px - var(--marker-radius))`,
          top: `calc(${start.y}px - var(--marker-radius))`,
          width: "calc(var(--marker-radius) * 2)",
          height: "calc(var(--marker-radius) * 2)",
          transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0)`,
        }}
        className={clsx(
          "absolute z-50 flex justify-center items-center bg-yellow-400/75 hover:bg-yellow-400/100 rounded-full shadow-md transition-colors duration-150 ease-in-out",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        {...listeners}
        {...attributes}
      >
        <span className="font-semibold text-black text-[10px] leading-none select-none px-1 text-center">
          Start
        </span>
      </motion.div>

      {/* Menu follows the SAME transform as Start */}
      <GestureMenu position={{ x: start.x, y: start.y }} transform={transform} />
    </>
  );
}

export function DraggableMarker({
  position,
}: {
  position: { x: number | null; y: number | null };
  props?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const { gesture } = useContext(GestureContext);

  // Normal marker drag (non-drag gestures)
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useDraggable({ id: "gestureMarker" });

  const selectedIcon =
    gesture.type
      ? gestureOptions
          .flatMap((g) => [g, ...(g.subGestures ?? [])])
          .find((opt) => opt.value === gesture.type)?.icon
      : null;

  const showDragEndpoints = useMemo(
    () => isDragGesture(gesture.type),
    [gesture.type]
  );

  // Base committed positions
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [end, setEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!showDragEndpoints) {
      setStart(null);
      setEnd(null);
      return;
    }

    if (start === null && position.x !== null && position.y !== null) {
      setStart({ x: position.x, y: position.y });
      setEnd({ x: position.x + 140, y: position.y });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDragEndpoints, position.x, position.y]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const id = String(active.id);

      if (id === "dragStart" && start) {
        setStart({ x: start.x + delta.x, y: start.y + delta.y });
      } else if (id === "dragEnd" && end) {
        setEnd({ x: end.x + delta.x, y: end.y + delta.y });
      }
    },
    [start, end]
  );

  const line = useMemo(() => {
    if (!start || !end) return null;
    return { dx: end.x - start.x, dy: end.y - start.y };
  }, [start, end]);

  // DRAG MODE
  if (showDragEndpoints) {
    if (!start || !end) return null;

    return (
      <>
        <DndContext onDragEnd={handleDragEnd}>
          {/* Start + menu that follows Start transform smoothly */}
          <DragStartWithMenu start={start} />

          {/* Line anchored to committed Start base (good enough visually; stays stable) */}
          {line && (
            <svg
              className="absolute z-40 pointer-events-none overflow-visible"
              style={{ left: start.x, top: start.y, width: 0, height: 0 }}
            >
              <line
                x1={0}
                y1={0}
                x2={line.dx}
                y2={line.dy}
                stroke="black"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>
          )}

          {/* End endpoint */}
          <DraggableEndpoint id="dragEnd" label="End" x={end.x} y={end.y} />
        </DndContext>
      </>
    );
  }

  // NORMAL MODE
  return (
    <>
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
            className="inline-flex items-center justify-center w-full h-full scale-[0.85]"
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
