import { ScreenGesture } from "@prisma/client";

export const GESTURE_DESCRIPTION_MAX_LENGTH = 75;

export type GestureTemplateSlotKey =
  | "element"
  | "area"
  | "intent"
  | "text"
  | "destination";

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

const gestureTemplates: GestureTemplate[] = [
  {
    type: "tap",
    fixedParts: ["TAP ", " TO ", ""],
    slots: [
      { key: "element", label: "element", placeholder: "button" },
      { key: "intent", label: "intent", placeholder: "open settings" },
    ],
  },
  {
    type: "swipe up",
    fixedParts: ["SWIPE UP ON ", " TO ", ""],
    slots: [
      { key: "area", label: "area", placeholder: "feed" },
      { key: "intent", label: "intent", placeholder: "see older items" },
    ],
  },
  {
    type: "swipe down",
    fixedParts: ["SWIPE DOWN ON ", " TO ", ""],
    slots: [
      { key: "area", label: "area", placeholder: "notification shade" },
      { key: "intent", label: "intent", placeholder: "refresh content" },
    ],
  },
  {
    type: "swipe left",
    fixedParts: ["SWIPE LEFT ON ", " TO ", ""],
    slots: [
      { key: "area", label: "area", placeholder: "carousel" },
      { key: "intent", label: "intent", placeholder: "view next item" },
    ],
  },
  {
    type: "swipe right",
    fixedParts: ["SWIPE RIGHT ON ", " TO ", ""],
    slots: [
      { key: "area", label: "area", placeholder: "carousel" },
      { key: "intent", label: "intent", placeholder: "view previous item" },
    ],
  },
  {
    type: "typing",
    fixedParts: ["TYPE ", " TO ", ""],
    slots: [
      { key: "text", label: "text", placeholder: "search query" },
      { key: "intent", label: "intent", placeholder: "find a result" },
    ],
  },
  {
    type: "touch and hold",
    fixedParts: ["TOUCH AND HOLD ", " TO ", ""],
    slots: [
      { key: "element", label: "element", placeholder: "app icon" },
      { key: "intent", label: "intent", placeholder: "open context menu" },
    ],
  },
  {
    type: "double tap",
    fixedParts: ["DOUBLE TAP ", " TO ", ""],
    slots: [
      { key: "element", label: "element", placeholder: "image" },
      { key: "intent", label: "intent", placeholder: "like post" },
    ],
  },
  {
    type: "drag",
    fixedParts: ["DRAG ", " TO ", " TO ", ""],
    slots: [
      { key: "element", label: "element", placeholder: "slider handle" },
      { key: "destination", label: "destination", placeholder: "right end" },
      { key: "intent", label: "intent", placeholder: "increase value" },
    ],
  },
  {
    type: "zoom in",
    fixedParts: ["ZOOM IN ON ", " TO ", ""],
    slots: [
      { key: "area", label: "area", placeholder: "map" },
      { key: "intent", label: "intent", placeholder: "inspect details" },
    ],
  },
  {
    type: "zoom out",
    fixedParts: ["ZOOM OUT ON ", " TO ", ""],
    slots: [
      { key: "area", label: "area", placeholder: "map" },
      { key: "intent", label: "intent", placeholder: "see larger area" },
    ],
  },
  {
    type: "rotate cw",
    fixedParts: ["ROTATE CLOCKWISE ON ", " TO ", ""],
    slots: [
      { key: "area", label: "area", placeholder: "photo" },
      { key: "intent", label: "intent", placeholder: "adjust orientation" },
    ],
  },
  {
    type: "rotate ccw",
    fixedParts: ["ROTATE COUNTERCLOCKWISE ON ", " TO ", ""],
    slots: [
      { key: "area", label: "area", placeholder: "photo" },
      { key: "intent", label: "intent", placeholder: "adjust orientation" },
    ],
  },
];

const gestureTemplateMap = new Map(
  gestureTemplates.map((template) => [template.type, template])
);

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");

export function isFreeformGestureType(type: ScreenGesture["type"]): boolean {
  return type === "other";
}

export function getGestureTemplate(
  type: ScreenGesture["type"]
): GestureTemplate | null {
  if (!type || type === "other") {
    return null;
  }
  return gestureTemplateMap.get(type) ?? null;
}

export function getGestureTemplateDefaultSlots(
  type: ScreenGesture["type"]
): Record<GestureTemplateSlotKey, string> {
  const template = getGestureTemplate(type);
  const defaults = {
    element: "",
    area: "",
    intent: "",
    text: "",
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

export function composeGestureTemplateDescription(
  type: ScreenGesture["type"],
  slotValues: Record<GestureTemplateSlotKey, string>
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

export function parseGestureTemplateDescription(
  type: ScreenGesture["type"],
  description: string
): Record<GestureTemplateSlotKey, string> | null {
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

export function validateGestureDescription(
  gesture: Pick<ScreenGesture, "type" | "description">
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
  return template.slots.every((slot) => parsed[slot.key].trim().length > 0);
}
