import { ScreenGesture } from "@prisma/client";

/**
 * Canonical persisted gesture types used across capture edit/evaluate flows.
 */
export const GESTURE_TYPES = {
  TAP: "tap",
  DOUBLE_TAP: "double tap",
  SWIPE_UP: "swipe up",
  SWIPE_DOWN: "swipe down",
  SWIPE_LEFT: "swipe left",
  SWIPE_RIGHT: "swipe right",
  TYPING: "typing",
  TOUCH_AND_HOLD: "touch and hold",
  DRAG: "drag",
  ZOOM_IN: "zoom in",
  ZOOM_OUT: "zoom out",
  ROTATE_CW: "rotate cw",
  ROTATE_CCW: "rotate ccw",
  OTHER: "other",
} as const satisfies Record<string, Exclude<ScreenGesture["type"], null>>;

export type CanonicalGestureType =
  (typeof GESTURE_TYPES)[keyof typeof GESTURE_TYPES];

/**
 * Top-level menu categories that should never be persisted as screen gesture types.
 */
export const GESTURE_GROUP_TYPES = {
  SWIPE: "swipe",
  ZOOM: "zoom",
  ROTATE: "rotate",
} as const;

const LEGACY_GESTURE_TYPE_MAP: Record<string, string> = {
  Tap: GESTURE_TYPES.TAP,
  "Double tap": GESTURE_TYPES.DOUBLE_TAP,
  "Finger Swipe": GESTURE_GROUP_TYPES.SWIPE,
  Typing: GESTURE_TYPES.TYPING,
  "Touch and hold": GESTURE_TYPES.TOUCH_AND_HOLD,
  Drag: GESTURE_TYPES.DRAG,
  "Drag up": GESTURE_TYPES.DRAG,
  "Drag down": GESTURE_TYPES.DRAG,
  "Drag left": GESTURE_TYPES.DRAG,
  "Drag right": GESTURE_TYPES.DRAG,
  Zoom: GESTURE_GROUP_TYPES.ZOOM,
  "Zoom in": GESTURE_TYPES.ZOOM_IN,
  "Zoom out": GESTURE_TYPES.ZOOM_OUT,
  Rotate: GESTURE_GROUP_TYPES.ROTATE,
  "Rotate right": GESTURE_TYPES.ROTATE_CW,
  "Rotate left": GESTURE_TYPES.ROTATE_CCW,
  Other: GESTURE_TYPES.OTHER,
};

/** Every value a gesture menu offers: the canonical types and their groups. */
const GESTURE_MENU_VALUES: readonly string[] = [
  ...Object.values(GESTURE_TYPES),
  ...Object.values(GESTURE_GROUP_TYPES),
];

/**
 * A stored gesture type in its canonical form (exact, then case-insensitive,
 * then a legacy name), or null. Plain data, so the review server actions can
 * run the same completeness checks as the browser.
 */
export function normalizeGestureType(type: string | null | undefined) {
  if (!type) return null;
  const raw = type.trim();
  if (!raw) return null;

  const exact = GESTURE_MENU_VALUES.find((value) => value === raw);
  if (exact) return exact;

  const lower = raw.toLowerCase();
  const caseInsensitive = GESTURE_MENU_VALUES.find(
    (value) => value.toLowerCase() === lower,
  );
  if (caseInsensitive) return caseInsensitive;

  return LEGACY_GESTURE_TYPE_MAP[lower] ?? null;
}
