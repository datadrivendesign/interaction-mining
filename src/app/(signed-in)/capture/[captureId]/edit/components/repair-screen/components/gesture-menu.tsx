"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  RefObject,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { GestureOption } from "@/lib/utils/gesture-options";
import { Progress } from "@/components/ui/progress";
import { useNavigation } from "../repair-screen";

import { CircleDashed } from "lucide-react";
import { motion } from "motion/react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

import clsx from "clsx";

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
    // Get the marker's position and droppable area height
    const droppableElement = document.querySelector("[data-droppable]");
    const droppableRect = droppableElement?.getBoundingClientRect();

    // If marker is in bottom 25% of droppable area, place textarea above
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
      setGesture((prev) => ({
        ...prev,
        description: value,
      }));
      setAnnotateLen(value.length);
    },
    [setGesture]
  );

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
            placeholder="What was your goal with this gesture?"
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
            placeholder="What was your goal with this gesture?"
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
  const { gesture, setGesture, gestureOptions } = useContext(GestureContext);
  const [open, setOpen] = useState(gesture.type === null);
  const [value, setValue] = useState(gesture.type);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  // Update gesture type when value changes
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
      // Reset gesture type when value is empty i.e. empty string i.e. no gesture selected
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
        <PopoverContent className="w-50 p-0">
          <Command>
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {gestureOptions.map((option) =>
                  option.subGestures ? (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onMouseEnter={() => {
                        setHoveredOption(option.value);
                      }}
                      onMouseLeave={() => {
                        setHoveredOption(null);
                      }}
                      className="cursor-pointer"
                    >
                      <div
                        id={`${option.value}-label`}
                        className={`inline-flex w-full items-center gap-2 transition-transform duration-200 ${
                          hoveredOption === option.value
                            ? "-translate-x-full"
                            : "translate-x-0"
                        }`}
                      >
                        {option.icon}
                        {option.label}
                      </div>
                      {/* Sub-gesture hidden menu shown on hover */}
                      <div
                        id={`${option.value}-sub-gestures`}
                        className={`absolute w-full inset-0 flex justify-center items-center transition-transform duration-200 ${
                          hoveredOption === option.value
                            ? "translate-x-0"
                            : "translate-x-full"
                        }`}
                      >
                        {option.subGestures.map((subOption: GestureOption) => (
                          <button
                            key={subOption.value}
                            className="w-full cursor-pointer"
                            onClick={() => {
                              setValue(subOption.value);
                              setOpen(false);
                              textareaRef.current?.focus();
                            }}
                          >
                            <span className="inline-flex items-center gap-2">
                              {value === subOption.value ? (
                                <Check
                                  className={cn("h-4 w-4", "opacity-100")}
                                />
                              ) : (
                                subOption.icon
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </CommandItem>
                  ) : (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer"
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue);
                        setOpen(false);
                        textareaRef.current?.focus();
                      }}
                    >
                      <span className="inline-flex items-center gap-2">
                        {value === option.value ? (
                          <Check className={cn("h-4 w-4", "opacity-100")} />
                        ) : (
                          option.icon
                        )}
                        {option.label}
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
          isDragging ? "cursor-grabbing" : "cursor-grab"
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
