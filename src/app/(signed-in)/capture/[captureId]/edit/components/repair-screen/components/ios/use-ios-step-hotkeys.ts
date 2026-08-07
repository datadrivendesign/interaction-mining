import { MutableRefObject, useEffect, useRef } from "react";
import { FRAME_STEP_SECONDS, STEP_COMMIT_DELAY_MS } from "./ios-helpers";

interface UseIosStepHotkeysArgs {
  videoDuration: number;
  currentTimeRef: MutableRefObject<number>;
  scrubPreviewTimeRef: MutableRefObject<number | null>;
  scheduleScrubDisplayTime: (time: number | null, immediate?: boolean) => void;
  scheduleScrubSeek: (
    targetTime: number,
    immediate?: boolean,
    syncFocus?: boolean,
  ) => void;
  handleScrubCommit: (time: number) => void;
  setPausedPreviewTime: (time: number | null) => void;
  onScrubActiveChange: (active: boolean) => void;
}

/**
 * Wires the comma/period (`,` / `.`) hotkeys for paused frame stepping.
 * The keydown commits a scrub-preview seek; the keyup (or idle window) commits
 * the final stepped frame so quick repeats coalesce into one commit.
 */
export function useIosStepHotkeys({
  videoDuration,
  currentTimeRef,
  scrubPreviewTimeRef,
  scheduleScrubDisplayTime,
  scheduleScrubSeek,
  handleScrubCommit,
  setPausedPreviewTime,
  onScrubActiveChange,
}: UseIosStepHotkeysArgs) {
  const stepCommitTimeoutRef = useRef<number | null>(null);
  const steppedTargetTimeRef = useRef<number | null>(null);
  const isSteppingRef = useRef(false);

  useEffect(() => {
    // Holding a step key is scrubbing by keyboard, so it reports itself as an
    // active scrub for the duration. Without that, each throttled seek landed
    // with nothing queued behind it, which reads as "the playhead has settled" —
    // so the preview was torn down and rebuilt on every repeat, flashing the
    // video element in and out for as long as the key was held.
    const beginStepping = () => {
      if (isSteppingRef.current) {
        return;
      }
      isSteppingRef.current = true;
      onScrubActiveChange(true);
    };

    const endStepping = () => {
      if (!isSteppingRef.current) {
        return;
      }
      isSteppingRef.current = false;
      onScrubActiveChange(false);
    };

    const flushSteppedTarget = () => {
      if (steppedTargetTimeRef.current === null) {
        return;
      }
      const targetTime = steppedTargetTimeRef.current;
      steppedTargetTimeRef.current = null;
      handleScrubCommit(targetTime);
    };

    const scheduleStepCommit = () => {
      if (stepCommitTimeoutRef.current !== null) {
        window.clearTimeout(stepCommitTimeoutRef.current);
      }
      stepCommitTimeoutRef.current = window.setTimeout(() => {
        stepCommitTimeoutRef.current = null;
        flushSteppedTarget();
        // Idle long enough to count as released, so the reveal can happen.
        endStepping();
      }, STEP_COMMIT_DELAY_MS);
    };

    const handleFrameStepKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key !== "," && event.key !== ".") {
        return;
      }

      event.preventDefault();
      beginStepping();
      const delta = event.key === "," ? -FRAME_STEP_SECONDS : FRAME_STEP_SECONDS;
      const baseTime =
        steppedTargetTimeRef.current ??
        scrubPreviewTimeRef.current ??
        currentTimeRef.current;
      const nextTime = Math.max(0, Math.min(baseTime + delta, videoDuration));

      steppedTargetTimeRef.current = nextTime;
      scheduleScrubDisplayTime(nextTime, true);
      setPausedPreviewTime(nextTime);
      scheduleScrubSeek(nextTime, false, true);
      scheduleStepCommit();
    };

    const handleFrameStepKeyup = (event: KeyboardEvent) => {
      if (event.key !== "," && event.key !== ".") {
        return;
      }
      event.preventDefault();
      if (stepCommitTimeoutRef.current !== null) {
        window.clearTimeout(stepCommitTimeoutRef.current);
        stepCommitTimeoutRef.current = null;
      }
      flushSteppedTarget();
      endStepping();
    };

    window.addEventListener("keydown", handleFrameStepKeydown);
    window.addEventListener("keyup", handleFrameStepKeyup);
    return () => {
      window.removeEventListener("keydown", handleFrameStepKeydown);
      window.removeEventListener("keyup", handleFrameStepKeyup);
    };
  }, [
    currentTimeRef,
    handleScrubCommit,
    onScrubActiveChange,
    scheduleScrubDisplayTime,
    scheduleScrubSeek,
    scrubPreviewTimeRef,
    setPausedPreviewTime,
    videoDuration,
  ]);

  // Cleanup any pending commit on unmount.
  useEffect(() => {
    return () => {
      if (stepCommitTimeoutRef.current !== null) {
        window.clearTimeout(stepCommitTimeoutRef.current);
      }
    };
  }, []);
}
