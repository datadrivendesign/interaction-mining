import { ScreenGesture } from "@prisma/client";

export const GESTURE_DESCRIPTION_MAX_LENGTH = 125;
export const MIN_SLOT_LENGTH = 2;

export type GestureTemplateSlotKey = "target" | "goal" | "destination";

export type GestureTemplateSlot = {
  key: GestureTemplateSlotKey;
  label: string;
  placeholder: string;
};

export type GestureTemplate = {
  type: Exclude<ScreenGesture["type"], null | "other">;
  fixedParts: readonly string[];
  slots: readonly GestureTemplateSlot[];
};

// Canonical phrase templates used to compose and parse stored gesture descriptions.
const gestureTemplates: GestureTemplate[] = [
  {
    type: "tap",
    fixedParts: ["Tap ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "button" },
      { key: "goal", label: "goal", placeholder: "open settings" },
    ],
  },
  {
    type: "swipe up",
    fixedParts: ["Swipe up on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "feed" },
      { key: "goal", label: "goal", placeholder: "see older items" },
    ],
  },
  {
    type: "swipe down",
    fixedParts: ["Swipe down on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "slider" },
      { key: "goal", label: "goal", placeholder: "see older items" },
    ],
  },
  {
    type: "swipe left",
    fixedParts: ["Swipe left on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "items list" },
      { key: "goal", label: "goal", placeholder: "view next item" },
    ],
  },
  {
    type: "swipe right",
    fixedParts: ["Swipe right on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "items list" },
      { key: "goal", label: "goal", placeholder: "view previous item" },
    ],
  },
  {
    type: "typing",
    fixedParts: ["Type in ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "search bar" },
      { key: "goal", label: "goal", placeholder: "search for item" },
    ],
  },
  {
    type: "touch and hold",
    fixedParts: ["Touch and hold ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "photo" },
      { key: "goal", label: "goal", placeholder: "open context menu" },
    ],
  },
  {
    type: "double tap",
    fixedParts: ["Double tap ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "image" },
      { key: "goal", label: "goal", placeholder: "like post" },
    ],
  },
  {
    type: "drag",
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
    type: "zoom in",
    fixedParts: ["Zoom in on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "map" },
      { key: "goal", label: "goal", placeholder: "inspect details" },
    ],
  },
  {
    type: "zoom out",
    fixedParts: ["Zoom out on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "map" },
      { key: "goal", label: "goal", placeholder: "see larger area" },
    ],
  },
  {
    type: "rotate cw",
    fixedParts: ["Rotate clockwise on ", " to ", ""],
    slots: [
      { key: "target", label: "target", placeholder: "photo" },
      { key: "goal", label: "goal", placeholder: "adjust orientation" },
    ],
  },
  {
    type: "rotate ccw",
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
  "rotate right": "rotate cw",
  "rotate left": "rotate ccw",
};

const normalizeTemplateGestureType = (
  type: ScreenGesture["type"],
): GestureTemplate["type"] | null => {
  if (!type || type === "other") {
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
  return type === "other";
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
  gesture: Pick<ScreenGesture, "type" | "description">,
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
