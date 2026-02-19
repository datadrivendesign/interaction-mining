"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  KeyboardEvent,
  useMemo,
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
import {
  composeGestureTemplateDescription,
  GESTURE_DESCRIPTION_MAX_LENGTH,
  getGestureTemplate,
  getGestureTemplateDefaultSlots,
  GestureTemplateSlot,
  GestureTemplateSlotKey,
  isFreeformGestureType,
  parseGestureTemplateDescription,
} from "../util";

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
  const firstSlotInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [placeTextareaAbove, setPlaceTextareaAbove] = useState(false);
  const { gesture, setGesture } = useContext(GestureContext);
  const { handleNext } = useNavigation();
  const [annotateLen, setAnnotateLen] = useState(0);
  const [slotValues, setSlotValues] = useState<Record<GestureTemplateSlotKey, string>>(
    getGestureTemplateDefaultSlots(gesture.type)
  );
  const [legacyTemplateHint, setLegacyTemplateHint] = useState(false);
  const hasInitializedTypeRef = useRef(false);
  const previousGestureTypeRef = useRef<ScreenGesture["type"]>(gesture.type);
  const maxLength = GESTURE_DESCRIPTION_MAX_LENGTH;
  const activeTemplate = useMemo(() => getGestureTemplate(gesture.type), [gesture.type]);

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

  useEffect(() => {
    setAnnotateLen((gesture.description ?? "").length);
  }, [gesture.description]);

  useEffect(() => {
    const previousType = previousGestureTypeRef.current;
    const typeChanged = previousType !== gesture.type;

    if (!gesture.type) {
      setLegacyTemplateHint(false);
      previousGestureTypeRef.current = gesture.type;
      return;
    }

    if (isFreeformGestureType(gesture.type)) {
      if (
        typeChanged &&
        hasInitializedTypeRef.current &&
        previousType &&
        !isFreeformGestureType(previousType)
      ) {
        const previousParsed = parseGestureTemplateDescription(
          previousType,
          gesture.description ?? ""
        );
        const previousTemplate = getGestureTemplate(previousType);
        if (
          previousParsed &&
          previousTemplate &&
          previousTemplate.slots.some(
            (slot) => previousParsed[slot.key].trim().length === 0
          )
        ) {
          setGesture((prev) => ({
            ...prev,
            description: "",
          }));
        }
      }
      setLegacyTemplateHint(false);
      previousGestureTypeRef.current = gesture.type;
      hasInitializedTypeRef.current = true;
      return;
    }

    if (typeChanged && hasInitializedTypeRef.current) {
      const defaults = getGestureTemplateDefaultSlots(gesture.type);
      setSlotValues(defaults);
      setLegacyTemplateHint(false);
      const templatedDescription = composeGestureTemplateDescription(
        gesture.type,
        defaults
      );
      if (templatedDescription !== gesture.description) {
        setGesture((prev) => ({
          ...prev,
          description: templatedDescription,
        }));
      }
      previousGestureTypeRef.current = gesture.type;
      return;
    }

    const parsed = parseGestureTemplateDescription(
      gesture.type,
      gesture.description ?? ""
    );
    if (parsed) {
      setSlotValues(parsed);
      setLegacyTemplateHint(false);
      const normalizedDescription = composeGestureTemplateDescription(
        gesture.type,
        parsed
      );
      if (normalizedDescription !== gesture.description) {
        setGesture((prev) => ({
          ...prev,
          description: normalizedDescription,
        }));
      }
      hasInitializedTypeRef.current = true;
      previousGestureTypeRef.current = gesture.type;
      return;
    }

    const defaults = getGestureTemplateDefaultSlots(gesture.type);
    const legacyText = (gesture.description ?? "").trim();
    if (legacyText.length > 0) {
      defaults.intent = legacyText;
      setLegacyTemplateHint(true);
    } else {
      setLegacyTemplateHint(false);
    }
    setSlotValues(defaults);
    const templatedDescription = composeGestureTemplateDescription(
      gesture.type,
      defaults
    );
    if (templatedDescription !== gesture.description) {
      setGesture((prev) => ({
        ...prev,
        description: templatedDescription,
      }));
    }
    hasInitializedTypeRef.current = true;
    previousGestureTypeRef.current = gesture.type;
  }, [gesture.type, gesture.description, setGesture]);

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleNext();
      }
    },
    [handleNext]
  );

  const handleFreeformChange = useCallback(
    (value: string) => {
      setGesture((prev) => ({
        ...prev,
        description: value,
      }));
    },
    [setGesture]
  );

  const handleSlotChange = useCallback(
    (slot: GestureTemplateSlot, value: string) => {
      if (!gesture.type || !activeTemplate) {
        return;
      }
      const nextValues = {
        ...slotValues,
        [slot.key]: value,
      };
      const nextDescription = composeGestureTemplateDescription(
        gesture.type,
        nextValues
      );
      if (nextDescription.length > maxLength) {
        return;
      }
      setSlotValues(nextValues);
      setGesture((prev) => ({
        ...prev,
        description: nextDescription,
      }));
    },
    [activeTemplate, gesture.type, maxLength, setGesture, slotValues]
  );

  const focusDescriptionField = useCallback(() => {
    if (isFreeformGestureType(gesture.type)) {
      textareaRef.current?.focus();
      return;
    }
    firstSlotInputRef.current?.focus();
  }, [gesture.type]);

  const annotationEditor = (
    <div className="w-full">
      {isFreeformGestureType(gesture.type) || !activeTemplate ? (
        <Textarea
          ref={textareaRef}
          className="text-sm w-full h-full bg-background!"
          placeholder="Describe this gesture in your own words."
          maxLength={maxLength}
          value={gesture.description ?? ""}
          onKeyDown={handleEnter}
          onChange={(e) => handleFreeformChange(e.target.value)}
        />
      ) : (
        <div className="rounded-md border bg-background p-2 space-y-2">
          <div className="text-xs text-muted-foreground">
            Edit only bracketed fields.
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {activeTemplate.fixedParts.map((fixedPart, index) => {
              const slot = activeTemplate.slots[index];
              return (
                <React.Fragment key={`${fixedPart}-${index}`}>
                  {fixedPart ? (
                    <span className="text-xs font-semibold tracking-wide text-foreground/90 whitespace-pre">
                      {fixedPart}
                    </span>
                  ) : null}
                  {slot ? (
                    <input
                      ref={index === 0 ? firstSlotInputRef : undefined}
                      className="h-7 min-w-24 max-w-40 rounded border bg-background px-2 text-xs"
                      aria-label={slot.label}
                      placeholder={slot.placeholder}
                      value={slotValues[slot.key] ?? ""}
                      onKeyDown={handleEnter}
                      onChange={(e) => handleSlotChange(slot, e.target.value)}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </div>
          {legacyTemplateHint ? (
            <p className="text-[11px] text-amber-600">
              Existing text was moved into intent. Complete missing fields.
            </p>
          ) : null}
        </div>
      )}
      <div className="w-full flex flex-col">
        <Progress className="w-full" value={(annotateLen / maxLength) * 100} />
        <div className="text-sm flex justify-end text-muted-foreground z-10">
          {`${annotateLen}/${maxLength}`}
        </div>
      </div>
    </div>
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
          {annotationEditor}
        </div>
      )}

      <GestureSelection focusDescriptionField={focusDescriptionField} />

      {!placeTextareaAbove && (
        <div className="absolute mt-1 w-full">
          {annotationEditor}
        </div>
      )}
    </div>
  );
}

function GestureSelection({
  focusDescriptionField,
}: {
  focusDescriptionField: () => void;
}) {
  const { gesture, setGesture, gestureOptions } = useContext(GestureContext);
  const [open, setOpen] = useState(gesture.type === null);
  const [value, setValue] = useState<ScreenGesture["type"] | "">(gesture.type);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  useEffect(() => {
    setValue(gesture.type);
  }, [gesture.type]);

  // Update gesture type when value changes
  useEffect(() => {
    if (value !== "") {
      setGesture((prev) => ({
        ...prev,
        type: value,
        scrollDeltaX:
          value === "swipe left" ? -0.02 : value === "swipe right" ? 0.02 : 0,
        scrollDeltaY:
          value === "swipe down" ? -0.02 : value === "swipe up" ? 0.02 : 0,
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
