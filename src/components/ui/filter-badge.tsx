import { X } from "lucide-react";
import { Badge } from "./badge";

interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
}

/**
 * FilterBadge displays selected filter options as badges with remove functionality.
 * @param label - Display text for the filter
 * @param onRemove - Callback when remove button is clicked
 */
export function FilterBadge({ label, onRemove }: FilterBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="flex cursor-pointer items-center gap-2 pr-2 hover:bg-red-500/100 hover:text-white dark:hover:bg-red-500/100"
      onClick={onRemove}
    >
      <X className="h-2 w-2" />
      {label}
    </Badge>
  );
}
