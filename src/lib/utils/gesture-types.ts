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
