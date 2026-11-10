"use client";

import type { RefObject } from "react";
import type { ScreenGesture } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  GESTURE_DESCRIPTION_MAX_LENGTH,
  getGestureTemplate,
  getGestureTemplateDefaultSlots,
  GestureTemplateSlotKey,
  isFreeformGestureType,
  MIN_SLOT_LENGTH,
  parseGestureTemplateDescription,
} from "../../../edit/components/repair-screen/util/gesture-description-template";
import { TargetSlotCombobox } from "../../../edit/components/repair-screen/components/target-slot-combobox";
import { ScreenDescription } from "./screen-description";

export type Slots = Record<GestureTemplateSlotKey, string>;

const SLOT_COLOR: Record<GestureTemplateSlotKey, { tab: string; box: string }> =
  {
    target: {
      tab: "bg-blue-600 dark:bg-blue-500",
      box: "border-blue-600 dark:border-blue-500",
    },
    goal: {
      tab: "bg-teal-700 dark:bg-teal-600",
      box: "border-teal-700 dark:border-teal-600",
    },
    destination: {
      tab: "bg-teal-700 dark:bg-teal-600",
      box: "border-teal-700 dark:border-teal-600",
    },
  };

/** Slot values for a gesture, keeping an old free-text description in "why". */
export function initialSlots(gesture?: ScreenGesture): Slots {
  const slots = getGestureTemplateDefaultSlots(gesture?.type ?? null);
  if (!gesture?.type || !gesture.description) return slots;
  const parsed = parseGestureTemplateDescription(
    gesture.type,
    gesture.description,
  );
  if (parsed) return parsed;
  // Saved before templates (or under another type): same as the edit page.
  return { ...slots, goal: gesture.description };
}

/** Moves typed slot text over to a new gesture type's slots. */
export function remapSlots(prev: Slots, nextType: string | null): Slots {
  const next = getGestureTemplateDefaultSlots(nextType);
  const template = nextType ? getGestureTemplate(nextType) : null;
  template?.slots.forEach((slot) => {
    next[slot.key] =
      prev[slot.key] ||
      (slot.key === "destination" ? prev.goal : "") ||
      (slot.key === "goal" ? prev.destination : "");
  });
  return next;
}

/** A saved description that predates the template, or null. */
export function getLegacyDescription(gesture?: ScreenGesture): string | null {
  return gesture?.type &&
    gesture.description &&
    !isFreeformGestureType(gesture.type) &&
    !parseGestureTemplateDescription(gesture.type, gesture.description)
    ? gesture.description
    : null;
}

/**
 * The "Describe it" step: one labelled field per template slot (or a single
 * text box for gestures without a template), and how the result reads.
 */
export function DescriptionFields({
  gestureType,
  slots,
  onSlotChange,
  freeform,
  onFreeformChange,
  firstSlotRef,
  nextGesture,
  isLastScreen,
  legacyDescription,
}: {
  gestureType: string;
  slots: Slots;
  onSlotChange: (key: GestureTemplateSlotKey, value: string) => void;
  freeform: string;
  onFreeformChange: (value: string) => void;
  /** The first field, focused after a gesture type is picked. */
  firstSlotRef: RefObject<HTMLInputElement>;
  /** The gesture as it would be saved, for the preview. */
  nextGesture: ScreenGesture | null;
  isLastScreen: boolean;
  legacyDescription: string | null;
}) {
  if (isFreeformGestureType(gestureType)) {
    return (
      <>
        <label className="text-sm font-medium" htmlFor="fix-freeform">
          What was done, then why
        </label>
        <Textarea
          id="fix-freeform"
          value={freeform}
          maxLength={GESTURE_DESCRIPTION_MAX_LENGTH}
          onChange={(event) => onFreeformChange(event.target.value)}
          placeholder="Pinch the photo with three fingers to share it"
        />
      </>
    );
  }

  const template = getGestureTemplate(gestureType);
  if (!template) return null;
  const descriptionLength = nextGesture?.description?.length ?? 0;

  return (
    <>
      {template.slots.map((slot) => {
        const value = slots[slot.key];
        const tooShort =
          value.trim().length > 0 && value.trim().length <= MIN_SLOT_LENGTH;
        const setSlot = (next: string) => onSlotChange(slot.key, next);
        // The label is a tab on the input's top edge, in the input's border
        // color, so the two read as one control.
        const inputClass = cn(
          "h-9 w-full max-w-none min-w-0 rounded-md rounded-tl-none border-2 bg-background px-2 text-sm",
          SLOT_COLOR[slot.key].box,
        );
        return (
          <div key={slot.key} className="flex flex-col">
            <span
              className={cn(
                "self-start rounded-t-md px-2 py-0.5 text-xs font-semibold text-white",
                SLOT_COLOR[slot.key].tab,
              )}
            >
              {slot.label}
            </span>
            {slot.key === "target" ? (
              <TargetSlotCombobox
                value={value}
                onChange={setSlot}
                onTouched={() => {}}
                slot={slot}
                inputRef={firstSlotRef}
                showError={tooShort}
                className={inputClass}
              />
            ) : (
              <Input
                value={value}
                aria-label={slot.label}
                placeholder={slot.placeholder}
                aria-invalid={tooShort}
                onChange={(event) => setSlot(event.target.value)}
                className={inputClass}
              />
            )}
            {tooShort && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                Use at least {MIN_SLOT_LENGTH + 1} letters.
              </p>
            )}
          </div>
        );
      })}
      <div className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
        <p className="mb-1 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
          Reads as
        </p>
        <ScreenDescription
          gesture={nextGesture}
          isLastScreen={isLastScreen}
          className="text-sm leading-relaxed"
        />
        <p className="mt-1 text-right text-[11px] text-neutral-500">
          {descriptionLength}/{GESTURE_DESCRIPTION_MAX_LENGTH}
        </p>
      </div>
      {legacyDescription && (
        <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Old description, from before the template:{" "}
          <span className="italic">“{legacyDescription}”</span>. It was copied
          into the second box. Split it into the parts above.
        </p>
      )}
    </>
  );
}
