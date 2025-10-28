import { X } from "lucide-react";
import { Badge } from "./badge";

interface FilterBadgeProps {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * FilterBadge displays selected filter options as badges with remove functionality.
 * @param key - Unique identifier for the filter
 * @param label - Display text for the filter
 * @param onRemove - Callback when remove button is clicked
 */
export function FilterBadge({ key, label, onRemove }: FilterBadgeProps) {
  return (
    <Badge
      key={key}
      variant="secondary"
      className="flex items-center gap-2 pr-2 hover:bg-red-500/100 dark:hover:bg-red-500/100 hover:text-white cursor-pointer"
      onClick={onRemove}
    >
      <X className="h-2 w-2" />
      {label}
    </Badge>
  );
}
