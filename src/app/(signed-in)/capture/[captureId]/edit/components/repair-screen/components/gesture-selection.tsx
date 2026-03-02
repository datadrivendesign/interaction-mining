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

import { GestureOption } from "@/lib/utils/gesture-options";
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
        <PopoverContent
          className="w-50 p-0"
          side={openAbove ? "top" : "bottom"}
          align="start"
          sideOffset={4}
          avoidCollisions={false}
        >
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
                  ),
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
