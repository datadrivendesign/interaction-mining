import { ScreenGesture } from "@prisma/client";

export function translateTypeAndroidToODIM(
  androidType: string,
  scrollDeltaX: number | null,
  scrollDeltaY: number | null
): string {
  if (
    androidType === "TYPE_VIEW_CLICKED" ||
    androidType == "TYPE_VIEW_SELECTED"
  ) {
    return "tap";
  } else if (androidType === "TYPE_VIEW_LONG_CLICKED") {
    return "touch and hold";
  } else if (androidType === "TYPE_VIEW_SCROLLED") {
    if (scrollDeltaX !== null && scrollDeltaY !== null) {
      // get direction of scroll/swipe w. dominant delta direction
      if (scrollDeltaX > 0 && scrollDeltaX > scrollDeltaY) {
        return "swipe right";
      } else if (scrollDeltaX < 0 && scrollDeltaX < scrollDeltaY) {
        return "swipe left";
      } else if (scrollDeltaY > 0 && scrollDeltaY > scrollDeltaX) {
        return "swipe up";
      } else if (scrollDeltaY < 0 && scrollDeltaY < scrollDeltaX) {
        return "swipe down";
      } else {
        return "other";
      }
    }
  }
  // fall through case, don't know what will reach
  return "";
}

function createScreenGesture(gesture: ScreenGesture): ScreenGesture {
  const { x, y, scrollDeltaX, scrollDeltaY, type } = gesture;
  const screenGesture: ScreenGesture = {
    type: type,
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
      scrollDeltaY
    );
  }
  return screenGesture;
}
