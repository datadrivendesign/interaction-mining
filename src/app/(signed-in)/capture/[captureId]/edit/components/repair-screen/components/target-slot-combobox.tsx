"use client";

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { GestureTemplateSlot, MIN_SLOT_LENGTH } from "../util";
import {
  TARGET_SLOT_OPTION_GROUPS,
  TargetSlotOptionGroup,
} from "../util/target-slot-options";

export function TargetSlotCombobox({
  value,
  onChange,
  onTouched,
  slot,
  inputRef,
  showError,
  onEnter,
  isGoalInvalid,
  onGoalTouched,
  isDestinationInvalid,
  onDestinationTouched,
}: {
  value: string;
  onChange: (value: string) => void;
  onTouched: () => void;
  slot: GestureTemplateSlot;
  inputRef?: React.Ref<HTMLInputElement>;
  showError?: boolean;
  onEnter?: () => void;
  isGoalInvalid?: boolean;
  onGoalTouched?: () => void;
  isDestinationInvalid?: boolean;
  onDestinationTouched?: () => void;
}) {
  const targetInputId = useId();
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetOptionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  // Filter the target options based on the input value
  const filteredTargetGroups = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return TARGET_SLOT_OPTION_GROUPS;
    return TARGET_SLOT_OPTION_GROUPS.map((group: TargetSlotOptionGroup) => ({
      ...group,
      options: group.options.filter((option) =>
        option.label.toLowerCase().includes(query),
      ),
    })).filter((group) => group.options.length > 0);
  }, [value]);

  // Flatten the filtered target options
  const flatFilteredTargetOptions = useMemo(
    () => filteredTargetGroups.flatMap((g) => g.options),
    [filteredTargetGroups],
  );

  // Highlight the first target option when the combobox is opened
  useEffect(() => {
    if (!open) return;
    setHighlightIndex((prev) =>
      flatFilteredTargetOptions.length === 0
        ? 0
        : Math.min(prev, flatFilteredTargetOptions.length - 1),
    );
  }, [flatFilteredTargetOptions, open]);

  // Scroll the highlighted target option into view when the combobox is opened
  useEffect(() => {
    if (!open || flatFilteredTargetOptions.length === 0) return;
    const highlightedValue = flatFilteredTargetOptions[highlightIndex]?.value;
    if (!highlightedValue) return;
    targetOptionRefs.current[highlightedValue]?.scrollIntoView({
      block: "nearest",
    });
  }, [flatFilteredTargetOptions, highlightIndex, open]);

  useEffect(
    () => () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    },
    [],
  );

  /**
   * Commit the selected target option to the input field
   *
   * @param selectedValue - The value of the selected target option.
   * @returns void.
   */
  const commitTargetOption = useCallback(
    (selectedValue: string) => {
      onChange(selectedValue);
      onTouched();
      setOpen(false);
      setHighlightIndex(0);
    },
    [onChange, onTouched],
  );

  /**
   * Handle the key down event for the input field
   * Handles the following key events:
   * - ArrowDown: Select the next target option
   * - ArrowUp: Select the previous target option
   * - Escape: Close the combobox
   * - Enter: Commit the selected target option
   * - Tab: Close the combobox
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!open) setOpen(true);
        if (flatFilteredTargetOptions.length === 0) return;
        const delta = e.key === "ArrowDown" ? 1 : -1;
        setHighlightIndex(
          (prev) =>
            (prev + delta + flatFilteredTargetOptions.length) %
            flatFilteredTargetOptions.length,
        );
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (open && flatFilteredTargetOptions[highlightIndex]?.value) {
          commitTargetOption(flatFilteredTargetOptions[highlightIndex].value);
          return;
        }
        const isTargetInvalid = value.trim().length <= MIN_SLOT_LENGTH;
        if (isTargetInvalid) {
          onTouched();
          return;
        }
        if (isGoalInvalid && onGoalTouched) {
          onGoalTouched();
          return;
        }
        if (isDestinationInvalid && onDestinationTouched) {
          onDestinationTouched();
          return;
        }
        onEnter?.();
        return;
      }
      if (e.key === "Tab") setOpen(false);
    },
    [
      commitTargetOption,
      flatFilteredTargetOptions,
      highlightIndex,
      isDestinationInvalid,
      isGoalInvalid,
      onDestinationTouched,
      onEnter,
      onGoalTouched,
      onTouched,
      open,
      value,
    ],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <input
          id={targetInputId}
          ref={inputRef}
          className={cn(
            "h-7 min-w-24 max-w-40 rounded border bg-background px-2 text-xs",
            showError ? "border-red-500" : "",
          )}
          aria-label={slot.label}
          placeholder={slot.placeholder}
          value={value}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            onTouched();
            if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlightIndex(0);
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-56 p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command
          shouldFilter={false}
          value={flatFilteredTargetOptions[highlightIndex]?.value ?? ""}
        >
          <CommandList>
            {filteredTargetGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.options.map((option) => {
                  const optionIndex = flatFilteredTargetOptions.findIndex(
                    (item) => item.value === option.value,
                  );
                  return (
                    <CommandItem
                      key={option.value}
                      ref={(node) => {
                        if (node) targetOptionRefs.current[option.value] = node;
                      }}
                      value={option.value}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => {
                        if (optionIndex >= 0) setHighlightIndex(optionIndex);
                      }}
                      onSelect={() => commitTargetOption(option.value)}
                      className="cursor-pointer"
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
