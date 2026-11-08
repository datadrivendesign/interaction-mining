"use client";

import type { ScreenGesture } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  getGestureTemplate,
  GestureTemplateSlotKey,
  isFreeformGestureType,
  parseGestureTemplateDescription,
} from "../../../edit/components/repair-screen/util/gesture-description-template";

/** Chip colors per template slot: what was touched in blue, why in teal. */
const SLOT_CHIP_CLASS: Record<GestureTemplateSlotKey, string> = {
  target: "bg-blue-600 text-white dark:bg-blue-500",
  goal: "bg-teal-700 text-white dark:bg-teal-600",
  destination: "bg-teal-700 text-white dark:bg-teal-600",
};

const CHIP_BASE =
  "rounded px-1 py-px font-semibold [box-decoration-break:clone] [-webkit-box-decoration-break:clone]";

/**
 * A screen's description in full, with the template's slots as colored chips
 * ("Tap [button] to [open settings]"). Descriptions that do not parse (the
 * freeform "other" gesture, drafts saved before templates) show as plain
 * text so a chip never marks a part that is not really there.
 */
export function ScreenDescription({
  gesture,
  isLastScreen,
  className,
}: {
  gesture?: ScreenGesture | null;
  isLastScreen: boolean;
  className?: string;
}) {
  const muted = "text-neutral-500 italic dark:text-neutral-400";
  if (!gesture?.type) {
    return (
      <p className={cn(className, muted)}>
        {isLastScreen ? "Final screen, no action" : "No gesture yet"}
      </p>
    );
  }
  const description = gesture.description?.trim() ?? "";
  if (!description) {
    return <p className={cn(className, muted)}>No description yet</p>;
  }

  const template = isFreeformGestureType(gesture.type)
    ? null
    : getGestureTemplate(gesture.type);
  const slots = template
    ? parseGestureTemplateDescription(gesture.type, description)
    : null;
  if (!template || !slots) {
    return <p className={className}>{description}</p>;
  }

  // fixedParts interleave with slots: fixed[0] slot[0] fixed[1] slot[1] ...
  return (
    <p className={className}>
      {template.fixedParts.map((fixed, index) => {
        const slot = template.slots[index];
        return (
          <span key={index}>
            {fixed}
            {slot && (
              <span className={cn(CHIP_BASE, SLOT_CHIP_CLASS[slot.key])}>
                {slots[slot.key]}
              </span>
            )}
          </span>
        );
      })}
    </p>
  );
}

/** Legend for the chip colors, shown in the gallery header. */
export function ScreenDescriptionLegend() {
  return (
    <span className="flex shrink-0 items-center gap-1 text-[10px]">
      <span className={cn(CHIP_BASE, SLOT_CHIP_CLASS.target)}>
        what you touched
      </span>
      <span
        className={cn(CHIP_BASE, SLOT_CHIP_CLASS.goal)}
        title="For a drag: where you dragged it"
      >
        why you touched it
      </span>
    </span>
  );
}
