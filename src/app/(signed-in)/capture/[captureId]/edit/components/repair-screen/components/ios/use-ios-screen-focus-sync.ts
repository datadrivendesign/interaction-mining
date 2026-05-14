import { useCallback } from "react";
import { FrameData } from "../../../types";
import { findNearestScreenIndex } from "./ios-helpers";

interface UseIosScreenFocusSyncArgs {
  screens: FrameData[];
  focusViewIndex: number;
  setFocusViewIndex: (index: number) => void;
}

export function useIosScreenFocusSync({
  screens,
  focusViewIndex,
  setFocusViewIndex,
}: UseIosScreenFocusSyncArgs) {
  const getNearestScreenIndex = useCallback(
    (time: number) => findNearestScreenIndex(screens, time),
    [screens],
  );

  const syncFocusToTimestamp = useCallback(
    (time: number) => {
      const nextIndex = getNearestScreenIndex(time);
      if (nextIndex >= 0 && nextIndex !== focusViewIndex) {
        setFocusViewIndex(nextIndex);
      }
    },
    [focusViewIndex, getNearestScreenIndex, setFocusViewIndex],
  );

  return { getNearestScreenIndex, syncFocusToTimestamp };
}
