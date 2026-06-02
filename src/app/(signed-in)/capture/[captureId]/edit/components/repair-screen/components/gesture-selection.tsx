"use client";

import React, { useContext, useEffect, useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  GestureOption,
  COMMAND_ITEM_CLASS,
  COMMAND_LIST_CLASS,
  findGestureOption,
  normalizeGestureType,
  POPOVER_CONTENT_CLASS,
} from "@/lib/utils/gesture-options";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";
import { GestureContext } from "./gesture-menu";

export function GestureSelection({
  focusDescriptionField,
  openAbove,
}: {
  focusDescriptionField: () => void;
  openAbove: boolean;
}) {
  const { gesture, setGesture, gestureOptions } = useContext(GestureContext);
  const [open, setOpen] = useState(gesture.type === null);
  const [value, setValue] = useState<string>(gesture.type ?? "");
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const toStoredGestureType = (raw: string): ScreenGesture["type"] | null => {
    if (!raw) return null;
    const normalized = normalizeGestureType(raw);
    return normalized ? (normalized as ScreenGesture["type"]) : null;
  };

  useEffect(() => {
    setValue(findGestureOption(gesture.type)?.value ?? "");
  }, [gesture.type]);

  const selectedStoredType = toStoredGestureType(value);
  const dragHelperText =
    selectedStoredType === GESTURE_TYPES.DRAG
      ? gesture.x === null || gesture.y === null
        ? "Click start point"
        : gesture.scrollDeltaX === null || gesture.scrollDeltaY === null
          ? "Click end point"
          : null
      : null;

  // Update gesture type when value changes
  useEffect(() => {
    const storedType = toStoredGestureType(value);
    if (storedType) {
      setGesture((prev) => {
        const wasDrag = prev.type === GESTURE_TYPES.DRAG;
        const isDrag = storedType === GESTURE_TYPES.DRAG;
        const isGestureTypeTransition = prev.type !== storedType;
        const resetDragPoints = isGestureTypeTransition && isDrag;

        return {
          ...prev,
          type: storedType,
          x: resetDragPoints ? null : prev.x,
          y: resetDragPoints ? null : prev.y,
          scrollDeltaX: isDrag
            ? resetDragPoints
              ? null
              : prev.scrollDeltaX
            : storedType === GESTURE_TYPES.SWIPE_LEFT
              ? -0.02
              : storedType === GESTURE_TYPES.SWIPE_RIGHT
                ? 0.02
                : 0,
          scrollDeltaY: isDrag
            ? resetDragPoints
              ? null
              : prev.scrollDeltaY
            : storedType === GESTURE_TYPES.SWIPE_DOWN
              ? -0.02
              : storedType === GESTURE_TYPES.SWIPE_UP
                ? 0.02
                : 0,
        };
      });
    } else {
      // Reset gesture type when value is empty i.e. empty string i.e. no gesture selected
      setGesture((prev) => ({
        ...prev,
        type: null,
      }));
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
                      onMouseEnter={() => {
                        setHoveredOption(option.value);
                      }}
                      onMouseLeave={() => {
                        setHoveredOption(null);
                      }}
                      className={cn(COMMAND_ITEM_CLASS, "cursor-pointer")}
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
                          <TooltipProvider
                            key={subOption.value}
                            delayDuration={0}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="w-full cursor-pointer"
                                  onClick={() => {
                                    setValue(subOption.value);
                                    setOpen(false);
                                    focusDescriptionField();
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
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                {subOption.label}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </CommandItem>
                  ) : (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      className={cn(COMMAND_ITEM_CLASS, "cursor-pointer")}
                      onSelect={(currentValue) => {
                        const selected =
                          currentValue === value ? "" : currentValue;
                        const normalized = normalizeGestureType(selected);
                        setValue(normalized ?? selected);
                        setOpen(false);
                        focusDescriptionField();
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
                  ),
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {dragHelperText ? (
        <div className="mt-1.5 inline-flex items-center rounded-md border border-black/20 dark:border-white/25 bg-black/85 dark:bg-white/90 px-2 py-1 text-xs font-semibold tracking-wide text-white dark:text-black shadow-sm">
          {dragHelperText}
        </div>
      ) : null}
    </div>
  );
}
