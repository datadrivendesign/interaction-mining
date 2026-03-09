import { ScreenGesture } from "@prisma/client";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";

type AndroidGesture = {
  type: string;
  scrollDeltaX: number | null;
  scrollDeltaY: number | null;
  x: number | null;
  y: number | null;
};

export function translateTypeAndroidToODIM(
  androidType: string,
  scrollDeltaX: number | null,
  scrollDeltaY: number | null,
): ScreenGesture["type"] | "" {
  if (
    androidType === "TYPE_VIEW_CLICKED" ||
    androidType == "TYPE_VIEW_SELECTED"
  ) {
    return GESTURE_TYPES.TAP;
  } else if (androidType === "TYPE_VIEW_LONG_CLICKED") {
    return GESTURE_TYPES.TOUCH_AND_HOLD;
  } else if (androidType === "TYPE_VIEW_SCROLLED") {
    if (scrollDeltaX !== null && scrollDeltaY !== null) {
      // get direction of scroll/swipe w. dominant delta direction
      if (scrollDeltaX > 0 && scrollDeltaX > scrollDeltaY) {
        return GESTURE_TYPES.SWIPE_RIGHT;
      } else if (scrollDeltaX < 0 && scrollDeltaX < scrollDeltaY) {
        return GESTURE_TYPES.SWIPE_LEFT;
      } else if (scrollDeltaY > 0 && scrollDeltaY > scrollDeltaX) {
        return GESTURE_TYPES.SWIPE_UP;
      } else if (scrollDeltaY < 0 && scrollDeltaY < scrollDeltaX) {
        return GESTURE_TYPES.SWIPE_DOWN;
      } else {
        // set as empty because we don't know what the gesture is
        return "";
      }
    }
  }
  // fall through case, don't know what will reach
  return "";
}

export function createScreenGesture(gesture: AndroidGesture): ScreenGesture {
  const { x, y, scrollDeltaX, scrollDeltaY, type } = gesture;
  const screenGesture: ScreenGesture = {
    type,
    x,
    y,
    scrollDeltaX,
    scrollDeltaY,
    description: "",
  };

  if (!type || type === "") {
    screenGesture.type = null;
  } else {
    screenGesture.type = translateTypeAndroidToODIM(
      type,
      scrollDeltaX,
      scrollDeltaY,
    );
  }
  return screenGesture;
}
