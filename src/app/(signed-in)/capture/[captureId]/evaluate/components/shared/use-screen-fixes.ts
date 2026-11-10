"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Capture, ScreenGesture } from "@prisma/client";
import { toast } from "sonner";
import {
  FrameData,
  Redaction,
  TraceFormData,
} from "../../../edit/components/types";
import { handleDraftSave } from "../../../edit/util";
import { getScreenAnnotationIssue } from "../../../edit/components/repair-screen/util/gesture-description-template";
import { normalizeGestureType } from "@/lib/utils/gesture-options";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";

/** The screen viewer's modes: look, fix the gesture, or fix the boxes. */
export type FixTab = "view" | "gesture" | "redaction";

/** The screen open in the viewer. A new screen is not in the trace yet. */
export type FixTarget = {
  screen: FrameData;
  isNew: boolean;
  tab: FixTab;
};

const sortByTime = (screens: FrameData[]) =>
  [...screens].sort((a, b) => a.timestamp - b.timestamp);

/** Box notes are trimmed on save, so compare them trimmed. */
function sameRedactions(a: Redaction[], b: Redaction[]) {
  const normalize = (boxes: Redaction[]) =>
    JSON.stringify(
      boxes.map((box) => ({ ...box, annotation: box.annotation.trim() })),
    );
  return normalize(a) === normalize(b);
}

/**
 * Same type and position. The offsets count only for a drag: for other
 * types the gesture picker fills in fixed values, which is not a fix.
 */
function sameGesturePlacement(a?: ScreenGesture, b?: ScreenGesture | null) {
  const sameBasics =
    (a?.type ?? null) === (b?.type ?? null) &&
    (a?.x ?? null) === (b?.x ?? null) &&
    (a?.y ?? null) === (b?.y ?? null);
  if (!sameBasics) return false;
  if (normalizeGestureType(a?.type) !== GESTURE_TYPES.DRAG) return true;
  return (
    (a?.scrollDeltaX ?? null) === (b?.scrollDeltaX ?? null) &&
    (a?.scrollDeltaY ?? null) === (b?.scrollDeltaY ?? null)
  );
}

/** True when saving these values would not change the screen. */
export function isScreenFixUnchanged(
  saved: { gesture?: ScreenGesture; redactions: Redaction[] },
  next: { gesture: ScreenGesture | null; redactions: Redaction[] },
): boolean {
  return (
    sameRedactions(saved.redactions, next.redactions) &&
    sameGesturePlacement(saved.gesture, next.gesture) &&
    (saved.gesture?.description ?? "").trim() ===
      (next.gesture?.description ?? "").trim()
  );
}

/**
 * Fix in place on the review page. Every saved fix writes a new draft right
 * away, so the draft a reviewer approves (or the admin publishes) is always
 * the one on screen. Refuses to save over a draft someone else saved after
 * this page loaded.
 */
export function useScreenFixes({
  capture,
  traceData,
  setTraceData,
  draftVersion,
  setDraftVersion,
  onScreenRemoved,
}: {
  capture?: Capture | null;
  traceData?: TraceFormData;
  setTraceData: Dispatch<SetStateAction<TraceFormData | undefined>>;
  draftVersion: string | null;
  setDraftVersion: (version: string) => void;
  /** Clears page state (active screen, selection) that points at a removed screen. */
  onScreenRemoved?: (screenId: string) => void;
}) {
  // Blocks a second save before the first one's state update renders.
  const isSavingRef = useRef(false);
  const [fixTarget, setFixTarget] = useState<FixTarget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fixedScreenIds, setFixedScreenIds] = useState<string[]>([]);

  const captureId = capture?.id;
  useEffect(() => {
    setFixTarget(null);
    setFixedScreenIds([]);
  }, [captureId]);

  const openFix = useCallback(
    (screenId: string, tab: FixTab = "view") => {
      const screen = traceData?.screens.find((s) => s.id === screenId);
      if (screen) setFixTarget({ screen, isNew: false, tab });
    },
    [traceData],
  );

  /** Opens Fix for a frame grabbed from the video; Cancel discards it. */
  const openAddScreen = useCallback((frame: FrameData) => {
    setFixTarget({ screen: frame, isNew: true, tab: "gesture" });
  }, []);

  const closeFix = useCallback(() => {
    setFixTarget((target) => {
      // A new screen's frame was never added to the trace; free it.
      if (target?.isNew && target.screen.src.startsWith("blob:")) {
        URL.revokeObjectURL(target.screen.src);
      }
      return null;
    });
  }, []);

  /**
   * Saves `applyFix(traceData)` as a new draft; `logText` starts the toast. On success the same change is
   * applied to the page's current trace (not a copy taken before the upload),
   * so screen images that finished loading during the save are kept.
   */
  const saveTrace = useCallback(
    async (
      applyFix: (data: TraceFormData) => TraceFormData,
      logText: string,
      fixedId?: string,
    ) => {
      if (!capture || !traceData || isSavingRef.current) return false;
      isSavingRef.current = true;
      setIsSaving(true);
      try {
        // The server refuses the save if someone saved a newer draft than
        // the one this page loaded.
        const res = await handleDraftSave(
          applyFix(traceData),
          capture,
          draftVersion,
        );
        if (!res.ok) {
          toast.error(res.message || "Could not save the fix. Try again.");
          return false;
        }
        setTraceData((prev) => (prev ? applyFix(prev) : prev));
        setDraftVersion(res.data.version);
        if (fixedId) {
          setFixedScreenIds((prev) =>
            prev.includes(fixedId) ? prev : [...prev, fixedId],
          );
        }
        toast.success(`${logText}. Saved as a new draft.`);
        return true;
      } catch {
        toast.error("Could not save the fix. Check your connection.");
        return false;
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [capture, draftVersion, setDraftVersion, setTraceData, traceData],
  );

  /** Saves the open screen's gesture (null = none) and redaction boxes. */
  const saveScreen = useCallback(
    async (gesture: ScreenGesture | null, redactions: Redaction[]) => {
      if (!traceData || !fixTarget) return false;
      const { screen, isNew } = fixTarget;
      const screensAfter = isNew
        ? sortByTime([...traceData.screens, screen])
        : traceData.screens;
      const number = screensAfter.findIndex((s) => s.id === screen.id) + 1;

      let logText: string;
      if (isNew) {
        // A screen added after the last one makes the old last screen a step
        // that needs a gesture; it must have one before the new screen goes in.
        if (number === screensAfter.length && number > 1) {
          const previous = screensAfter[number - 2];
          if (getScreenAnnotationIssue(traceData.gestures[previous.id])) {
            toast.error(
              `Screen ${number - 1} would no longer be the last screen, so it needs a gesture first. Fix screen ${number - 1}, then add this one.`,
            );
            return false;
          }
        }
        logText = `Screen ${number} added`;
      } else {
        if (
          isScreenFixUnchanged(
            {
              gesture: traceData.gestures[screen.id],
              redactions: traceData.redactions[screen.id] ?? [],
            },
            { gesture, redactions },
          )
        ) {
          toast.info("Nothing changed on this screen.");
          return false;
        }
        logText = `Screen ${number} fixed`;
      }

      const ok = await saveTrace(
        (data) => {
          const gestures = { ...data.gestures };
          if (gesture) gestures[screen.id] = gesture;
          else delete gestures[screen.id];
          const allRedactions = { ...data.redactions };
          if (redactions.length > 0) allRedactions[screen.id] = redactions;
          else delete allRedactions[screen.id];
          return {
            ...data,
            screens: isNew
              ? sortByTime([...data.screens, screen])
              : data.screens,
            gestures,
            redactions: allRedactions,
            vhs:
              isNew && data.vhs ? { ...data.vhs, [screen.id]: {} } : data.vhs,
          };
        },
        logText,
        screen.id,
      );
      if (ok) setFixTarget(null);
      return ok;
    },
    [fixTarget, saveTrace, traceData],
  );

  /** Removes the open screen from the trace. */
  const removeScreen = useCallback(async () => {
    if (!traceData || !fixTarget || fixTarget.isNew) return false;
    const { screen } = fixTarget;
    if (traceData.screens.length <= 1) return false;
    const number = traceData.screens.findIndex((s) => s.id === screen.id) + 1;
    const ok = await saveTrace((data) => {
      const gestures = { ...data.gestures };
      delete gestures[screen.id];
      const redactions = { ...data.redactions };
      delete redactions[screen.id];
      let vhs = data.vhs;
      if (vhs) {
        vhs = { ...vhs };
        delete vhs[screen.id];
      }
      return {
        ...data,
        screens: data.screens.filter((s) => s.id !== screen.id),
        gestures,
        redactions,
        vhs,
      };
    }, `Screen ${number} removed`);
    if (ok) {
      setFixedScreenIds((prev) => prev.filter((id) => id !== screen.id));
      setFixTarget(null);
      onScreenRemoved?.(screen.id);
      if (screen.src.startsWith("blob:")) URL.revokeObjectURL(screen.src);
    }
    return ok;
  }, [fixTarget, onScreenRemoved, saveTrace, traceData]);

  /** Saves a new Interaction Summary (the whole capture's description). */
  const saveTaskDescription = useCallback(
    (text: string) =>
      saveTrace(
        (data) => ({ ...data, description: text.trim() }),
        "Interaction summary updated",
      ),
    [saveTrace],
  );

  return {
    saveTaskDescription,
    fixTarget,
    openFix,
    openAddScreen,
    closeFix,
    saveScreen,
    removeScreen,
    isSaving,
    fixedScreenIds,
  };
}
