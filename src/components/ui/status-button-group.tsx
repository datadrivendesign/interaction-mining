import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ButtonGroup } from "./button-group";

interface StatusButtonGroupProps {
  options: { value: string; label: string }[];
  selected: string;
  onChange: (option: { value: string; label: string }) => void;
  label?: string;
}

/**
 * StatusButtonGroup displays group of buttons for segmented control for mutually exclusive status options.
 * @param options - Array of options to display
 * @param selected - The currently selected option
 * @param onChange - Callback when an option is selected
 * @param label - The label to display for the button group
 */
export function StatusButtonGroup({
  options,
  selected,
  onChange,
  label = "Filter Status:",
}: StatusButtonGroupProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-base font-bold text-foreground whitespace-nowrap">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <ButtonGroup>
          {options.map((option) => (
            <Button
              key={option.value}
              variant={selected === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(option)}
              className={cn(
                selected === option.value ? "bg-blue-500/100 text-white" : "",
                "text-xs hover:bg-blue-500/100 hover:text-white pointer-cursor"
              )}
            >
              {option.label}
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </div>
  );
}
