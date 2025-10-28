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
}

/**
 * Combobox is a UI component in admin route that allows the user to select an option from a list of options.
 * TODO: Consider generalizing this component for use in other parts of the application.
 * @param options - The options to display in the combobox.
 * @param selectCallback - The callback to call when an option is selected.
 * @returns A Combobox component.
 */
export function Combobox({ options, selectCallback }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-72 justify-between"
        >
          Select option...
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <Command>
          <CommandInput placeholder="Search option..." className="h-9" />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
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
