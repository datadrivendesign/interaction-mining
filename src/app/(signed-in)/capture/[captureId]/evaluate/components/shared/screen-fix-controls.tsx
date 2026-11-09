"use client";

import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The Fix button under a gallery card. */
export function FixScreenButton({
  screenNumber,
  disabled,
  onClick,
}: {
  screenNumber: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      // A lighter border and its own fill in dark mode, where the outline
      // style's border nearly disappears on the gallery background.
      className="h-7 w-full text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700"
      disabled={disabled}
      aria-label={`Fix screen ${screenNumber}`}
      title="Fix this screen (F)"
      onClick={onClick}
    >
      <Wrench className="size-3.5" />
      Fix
    </Button>
  );
}
