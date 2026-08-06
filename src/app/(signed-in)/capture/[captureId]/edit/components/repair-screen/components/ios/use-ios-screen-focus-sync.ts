import { useCallback } from "react";
import { FrameData } from "../../../types";
import { SelectScreenSource } from "../../repair-screen";
import { findNearestScreenIndex } from "./ios-helpers";

interface UseIosScreenFocusSyncArgs {
  screens: FrameData[];
  focusedScreenId: string | null;
  selectScreen: (screenId: string | null, source: SelectScreenSource) => void;
}

/**
 * Derives the focused screen from a playhead position — the one-way half of the
 * relationship. Selections made this way are tagged `"playhead"`, which is
 * excluded from moving the recording, so the derivation cannot feed back into
 * the position it came from.
 */
export function useIosScreenFocusSync({
  screens,
  focusedScreenId,
  selectScreen,
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
        selectScreen(nextScreenId, "playhead");
      }
    },
    [focusedScreenId, getNearestScreenIndex, screens, selectScreen],
  );

  return { getNearestScreenIndex, syncFocusToTimestamp };
}
