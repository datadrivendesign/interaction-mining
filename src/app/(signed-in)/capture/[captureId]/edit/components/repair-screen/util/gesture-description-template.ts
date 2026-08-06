import { ScreenGesture } from "@prisma/client";
import { normalizeGestureType } from "@/lib/utils/gesture-options";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";

export const GESTURE_DESCRIPTION_MAX_LENGTH = 125;
export const MIN_SLOT_LENGTH = 2;

export type GestureTemplateSlotKey = "target" | "goal" | "destination";

export type GestureTemplateSlot = {
  key: GestureTemplateSlotKey;
  label: string;
  placeholder: string;
};

export type GestureTemplate = {
  type: Exclude<ScreenGesture["type"], null | typeof GESTURE_TYPES.OTHER>;
  fixedParts: readonly string[];
  slots: readonly GestureTemplateSlot[];
};

// Canonical phrase templates used to compose and parse stored gesture descriptions.
const gestureTemplates: GestureTemplate[] = [
  {
    type: GESTURE_TYPES.TAP,
    fixedParts: ["Tap ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "button" },
      { key: "goal", label: "goal", placeholder: "open settings" },
    ],
  },
  {
    type: GESTURE_TYPES.SWIPE_UP,
    fixedParts: ["Swipe up on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "feed" },
      { key: "goal", label: "goal", placeholder: "see older items" },
    ],
  },
  {
    type: GESTURE_TYPES.SWIPE_DOWN,
    fixedParts: ["Swipe down on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "slider" },
      { key: "goal", label: "goal", placeholder: "see older items" },
    ],
  },
  {
    type: GESTURE_TYPES.SWIPE_LEFT,
    fixedParts: ["Swipe left on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "items list" },
      { key: "goal", label: "goal", placeholder: "view next item" },
    ],
  },
  {
    type: GESTURE_TYPES.SWIPE_RIGHT,
    fixedParts: ["Swipe right on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "items list" },
      { key: "goal", label: "goal", placeholder: "view previous item" },
    ],
  },
  {
    type: GESTURE_TYPES.TYPING,
    fixedParts: ["Type in ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "search bar" },
      { key: "goal", label: "goal", placeholder: "search for item" },
    ],
  },
  {
    type: GESTURE_TYPES.TOUCH_AND_HOLD,
    fixedParts: ["Touch and hold ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "photo" },
      { key: "goal", label: "goal", placeholder: "open context menu" },
    ],
  },
  {
    type: GESTURE_TYPES.DOUBLE_TAP,
    fixedParts: ["Double tap ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "image" },
      { key: "goal", label: "goal", placeholder: "like post" },
    ],
  },
  {
    type: GESTURE_TYPES.DRAG,
    fixedParts: ["Drag ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "slider handle" },
      {
        key: "destination",
        label: "destination",
        placeholder: "increase value to 40%",
      },
    ],
  },
  {
    type: GESTURE_TYPES.ZOOM_IN,
    fixedParts: ["Zoom in on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "map" },
      { key: "goal", label: "goal", placeholder: "inspect details" },
    ],
  },
  {
    type: GESTURE_TYPES.ZOOM_OUT,
    fixedParts: ["Zoom out on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "map" },
      { key: "goal", label: "goal", placeholder: "see larger area" },
    ],
  },
  {
    type: GESTURE_TYPES.ROTATE_CW,
    fixedParts: ["Rotate clockwise on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "photo" },
      { key: "goal", label: "goal", placeholder: "adjust orientation" },
    ],
  },
  {
    type: GESTURE_TYPES.ROTATE_CCW,
    fixedParts: ["Rotate counterclockwise on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "map" },
      { key: "goal", label: "goal", placeholder: "adjust orientation" },
    ],
  },
];

// Fast lookup by gesture type for runtime validation and rendering.
const gestureTemplateMap = new Map(
  gestureTemplates.map((template) => [template.type, template]),
);

// Accept UI/display aliases while keeping cw/ccw as canonical persisted types.
const gestureTemplateTypeAliasMap: Record<string, GestureTemplate["type"]> = {
  "rotate right": GESTURE_TYPES.ROTATE_CW,
  "rotate left": GESTURE_TYPES.ROTATE_CCW,
};

const normalizeTemplateGestureType = (
  type: ScreenGesture["type"],
): GestureTemplate["type"] | null => {
  if (!type || type === GESTURE_TYPES.OTHER) {
    return null;
  }
  const lowerType = type.toLowerCase();
  const aliasedType = gestureTemplateTypeAliasMap[lowerType];
  return (aliasedType ?? lowerType) as GestureTemplate["type"];
};

// Adds in fixed template parts into the regex pattern
const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

/**
 * Returns true if the gesture type is freeform, false otherwise.
 *
 * @param type - The gesture type.
 * @returns True if the gesture type is freeform, false otherwise.
 */
export function isFreeformGestureType(type: ScreenGesture["type"]): boolean {
  return type === GESTURE_TYPES.OTHER;
}

/**
 * Fast lookup by gesture type for runtime validation and rendering.
 *
 * @param type - The gesture type.
 * @returns The gesture template, or null if the type is not found.
 */
export function getGestureTemplate(
  type: ScreenGesture["type"],
): GestureTemplate | null {
  const normalizedType = normalizeTemplateGestureType(type);
  if (!normalizedType) {
    return null;
  }
  return gestureTemplateMap.get(normalizedType) ?? null;
}

/**
 * Return a fully shaped slot object so UI code can stay simple and controlled.
 *
 * @param type - The gesture type.
 * @returns The default slot values.
 */
export function getGestureTemplateDefaultSlots(
  type: ScreenGesture["type"],
): Record<GestureTemplateSlotKey, string> {
  const template = getGestureTemplate(type);
  const defaults = {
    target: "",
    goal: "",
    destination: "",
  };
  if (!template) {
    return defaults;
  }
  template.slots.forEach((slot) => {
    defaults[slot.key] = "";
  });
  return defaults;
}

/**
 * Build persisted description text from fixed template parts + editable slot values.
 * @param type - The gesture type.
 * @param slotValues - The slot values.
 * @returns The composed description.
 */
export function composeGestureTemplateDescription(
  type: ScreenGesture["type"],
  slotValues: Record<GestureTemplateSlotKey, string>,
): string {
  const template = getGestureTemplate(type);
  if (!template) {
    return "";
  }
  return template.fixedParts.reduce((description, fixedPart, index) => {
    const slot = template.slots[index - 1];
    if (!slot) {
      return `${description}${fixedPart}`;
    }
    return `${description}${slotValues[slot.key].trim()}${fixedPart}`;
  });
}

/**
 * Parse persisted description back into slot values to hydrate the template UI.
 *
 * @param type - The gesture type.
 * @param description - The persisted description.
 * @returns The slot values, or null if the description is invalid.
 */
export function parseGestureTemplateDescription(
  type: ScreenGesture["type"],
  description: string,
): Record<GestureTemplateSlotKey, string> | null {
  // Parse persisted description back into slot values to hydrate the template UI.
  const template = getGestureTemplate(type);
  if (!template) {
    return null;
  }
  const pattern = template.fixedParts.reduce((regex, fixedPart, index) => {
    const fixedRegex = escapeRegex(fixedPart);
    if (index === 0) {
      return `${regex}${fixedRegex}`;
    }
    return `${regex}(.*?)${fixedRegex}`;
  }, "^\\s*");
  const matcher = new RegExp(`${pattern}\\s*$`, "i");
  const match = description.match(matcher);
  if (!match) {
    return null;
  }

  const parsed = getGestureTemplateDefaultSlots(type);
  template.slots.forEach((slot, index) => {
    parsed[slot.key] = (match[index + 1] ?? "").trim();
  });
  return parsed;
}

/**
 * Shared validation for filmstrip error badges and form schema refinement.
 *
 * @param gesture - The gesture to validate.
 * @returns True if the gesture description is valid, false otherwise.
 */
export function validateGestureDescription(
  gesture: Pick<
    ScreenGesture,
    "type" | "description" | "x" | "y" | "scrollDeltaX" | "scrollDeltaY"
  >,
): boolean {
  if (!gesture.type) {
    return false;
  }
  const description = gesture.description?.trim() ?? "";
  if (!description) {
    return false;
  }
  if (description.length > GESTURE_DESCRIPTION_MAX_LENGTH) {
    return false;
  }
  if (isFreeformGestureType(gesture.type)) {
    return true;
  }
  if (normalizeGestureType(gesture.type) === GESTURE_TYPES.DRAG) {
    if (!hasCompleteDragPoints(gesture)) {
      return false;
    }
  }

  const template = getGestureTemplate(gesture.type);
  if (!template) {
    return false;
  }
  const parsed = parseGestureTemplateDescription(gesture.type, description);
  if (!parsed) {
    return false;
  }
  return template.slots.every((slot) => {
    const value = parsed[slot.key].trim();
    return value.length > MIN_SLOT_LENGTH;
  });
}

/**
 * Whether a screen's annotation is finished: a gesture exists, it is placed
 * somewhere on the screen, and its description satisfies the template.
 *
 * Single source of truth for "is this screen done", shared by the filmstrip's
 * error ring and the step's Next gate so the two cannot disagree — previously
 * the ring ignored marker placement while the gate required it, so a screen
 * could look complete and still block the step.
 *
 * @param gesture - The gesture recorded for a screen, if any.
 */
export function isScreenAnnotationComplete(
  gesture:
    | Pick<
        ScreenGesture,
        "type" | "description" | "x" | "y" | "scrollDeltaX" | "scrollDeltaY"
      >
    | null
    | undefined,
): boolean {
  if (!gesture) {
    return false;
  }
  // validateGestureDescription covers type, template slots and drag end-points,
  // but not whether the marker was ever placed.
  if (
    gesture.x === null ||
    gesture.x === undefined ||
    gesture.y === null ||
    gesture.y === undefined
  ) {
    return false;
  }
  return validateGestureDescription(gesture);
}

export function hasCompleteDragPoints(
  gesture: Pick<ScreenGesture, "x" | "y" | "scrollDeltaX" | "scrollDeltaY">,
): boolean {
  return (
    gesture.x !== null &&
    gesture.y !== null &&
    gesture.scrollDeltaX !== null &&
    gesture.scrollDeltaY !== null
  );
}
