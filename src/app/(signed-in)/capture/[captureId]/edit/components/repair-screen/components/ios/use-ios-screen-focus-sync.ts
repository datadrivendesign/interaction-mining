import { useCallback } from "react";
import { FrameData } from "../../../types";
import { findNearestScreenIndex } from "./ios-helpers";

interface UseIosScreenFocusSyncArgs {
  screens: FrameData[];
  focusedScreenId: string | null;
  setFocusedScreenId: (screenId: string | null) => void;
}

export function useIosScreenFocusSync({
  screens,
  focusedScreenId,
  setFocusedScreenId,
}: UseIosScreenFocusSyncArgs) {
  const getNearestScreenIndex = useCallback(
    (time: number) => findNearestScreenIndex(screens, time),
    [screens],
  );

  const syncFocusToTimestamp = useCallback(
    (time: number) => {
      const nextIndex = getNearestScreenIndex(time);
      if (nextIndex < 0) {
        return;
      }
      const nextScreenId = screens[nextIndex].id;
      if (nextScreenId !== focusedScreenId) {
        setFocusedScreenId(nextScreenId);
      }
    },
    [focusedScreenId, getNearestScreenIndex, screens, setFocusedScreenId],
  );

  return { getNearestScreenIndex, syncFocusToTimestamp };
}
