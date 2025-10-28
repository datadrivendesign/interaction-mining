"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * ComboboxOption is the type for the options in the combobox. Each combobox option should have a value and a label.
 * @param value - The value of the option.
 * @param label - The label of the option.
 */
export type ComboboxOption = { value: string; label: string };

/**
 * ComboboxProps is the props for the Combobox component.
 * @param options - The options to display in the combobox.
 * @param selectCallback - A custom callback to call when an option is selected.
 */
export interface ComboboxProps {
  options: ComboboxOption[];
  selectCallback?: (option: ComboboxOption) => void;
  placeholder?: string; // NEW - default: "Select option..."
  searchPlaceholder?: string; // NEW - default: "Search option..."
  emptyText?: string; // NEW - default: "No option found."
  buttonClassName?: string; // NEW - allow width customization
  contentClassName?: string; // NEW - allow width customization
  disabled?: boolean; // NEW - support disabled state
}

/**
 * Combobox is a UI component in admin route that allows the user to select an option from a list of options.
 * @param options - The options to display in the combobox.
 * @param selectCallback - The callback to call when an option is selected.
 * @param placeholder - The placeholder text to display in the combobox.
 * @param searchPlaceholder - The placeholder text to display in the search input.
 * @param emptyText - The text to display when no options are found.
 * @param buttonClassName - The class names to apply to the button.
 * @param contentClassName - The class names to apply to the content.
 * @param disabled - Whether the combobox is disabled.
 * @returns A Combobox component.
 */
export function Combobox({
  options,
  selectCallback,
  placeholder = "Select option...",
  searchPlaceholder = "Search option...",
  emptyText = "No option found.",
  buttonClassName = "w-72 justify-between",
  contentClassName = "w-96 p-0",
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={buttonClassName}
          disabled={disabled}
        >
          {placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={contentClassName}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    setOpen(false);
                    selectCallback?.(option);
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
