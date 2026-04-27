import { useEffect, useRef, useState } from "react";

interface UseRedactKeyboardStateArgs {
  onCancelDraft: () => void;
}

/**
 * Tracks shift-down (used for shift-click multi-select) and routes Escape to
 * cancel an in-progress drawing. Listens at window level so focus state is
 * irrelevant.
 */
export function useRedactKeyboardState({
  onCancelDraft,
}: UseRedactKeyboardStateArgs) {
  const [shiftDown, setShiftDown] = useState(false);
  const onCancelDraftRef = useRef(onCancelDraft);

  useEffect(() => {
    onCancelDraftRef.current = onCancelDraft;
  }, [onCancelDraft]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShiftDown(true);
        return;
      }
      if (e.key === "Escape") {
        onCancelDraftRef.current();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setShiftDown(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return { shiftDown };
}
