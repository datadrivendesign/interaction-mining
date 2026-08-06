"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { Platform } from "@/lib/utils";
import { useFormContext, useWatch } from "react-hook-form";
import { FrameData, TraceFormData } from "../types";

import { useHotkeys } from "react-hotkeys-hook";
import { RepairScreenAndroid } from "./components/android/repair-screen-android";
import { RepairScreenIOS } from "./components/ios/repair-screen-ios";
import { Prisma, ScreenGesture } from "@prisma/client";
import { DraftFetchResults } from "../../util";
import { ListedFiles } from "@/lib/actions";
import { validateGestureDescription } from "./util";

export interface RepairScreenJumpTarget {
  nonce: number;
  screenId: string;
}

/**
 * Stable fallback for the watched screens list. A fresh `[]` literal would
 * change identity every render and defeat every dependency array that reads it.
 */
const EMPTY_SCREENS: FrameData[] = [];

interface NavigationContextType {
  handleNext: () => void;
  handlePrevious: () => void;
  handleDeleteScreen: (screenId: string) => void;
  /**
   * The focused screen, identified by id. Authoritative — inserting or deleting
   * a screen shifts positions, so an index cannot survive an edit to the trace.
   */
  focusedScreenId: string | null;
  setFocusedScreenId: (screenId: string | null) => void;
  /**
   * Position of the focused screen in the sorted list, derived from
   * `focusedScreenId`. Provided here so ordering questions ("is this the last
   * screen?", "what is next?") have one answer rather than one per consumer.
   * `-1` when nothing is focused or the focused screen no longer exists.
   */
  focusedIndex: number;
  /**
   * Lets a platform with a scrubbable recording hand up a seek function, so an
   * explicit jump to a screen can move the playhead with it. Pass `null` to
   * unregister. Android has no recording to scrub and never registers.
   */
  registerSeekToTime: (seek: ((timestamp: number) => void) | null) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export const NavigationProvider: React.FC<{
  children: React.ReactNode;
  value: NavigationContextType;
}> = ({ children, value }) => {
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};

export default function RepairScreen({
  capture,
  draftFetchResult,
  files,
  jumpTarget,
}: {
  capture:
    | Prisma.CaptureGetPayload<{
        include: {
          app: true;
          task: true;
        };
      }>
    | undefined;
  draftFetchResult: DraftFetchResults;
  files: ListedFiles[];
  jumpTarget?: RepairScreenJumpTarget | null;
}) {
  const { getValues, setValue } = useFormContext<TraceFormData>();
  // Only `screens` is watched. Dropping the `gestures` subscription keeps this
  // component from re-rendering on every keystroke in the annotation editor —
  // react-hook-form hands out a deep clone of the form on each write, which is
  // what made the jump effect re-fire per keystroke in the first place.
  const screens = (useWatch({ name: "screens" }) ??
    EMPTY_SCREENS) as FrameData[];

  const os = capture?.task ? capture.task.os : "none";
  const [focusedScreenId, setFocusedScreenId] = useState<string | null>(null);
  const focusedIndex = useMemo(
    () =>
      focusedScreenId === null
        ? -1
        : screens.findIndex((screen) => screen.id === focusedScreenId),
    [focusedScreenId, screens],
  );

  // Held in a ref rather than state: registering a seek function must not
  // re-render, and the jump effect only ever reads the current one.
  const seekToTimeRef = useRef<((timestamp: number) => void) | null>(null);
  const registerSeekToTime = useCallback(
    (seek: ((timestamp: number) => void) | null) => {
      seekToTimeRef.current = seek;
    },
    [],
  );

  // Navigation is deliberately unguarded. Gesture completeness is enforced
  // where it can actually hold — the step gates in page.tsx check every screen
  // and name each one that needs work. Blocking
  // Tab/arrows only trapped keyboard users: it was silent, one-directional
  // (Previous was always free), and bypassed by clicking a filmstrip item or a
  // feedback chip, so it enforced nothing while making the keyboard feel broken
  // — you could not even reach a newly captured screen without first filling in
  // every incomplete screen ahead of it.

  // handle focusing on previous screen in the filmstrip list
  const handlePrevious = useCallback(() => {
    if (screens.length === 0) {
      return;
    }
    // javascript be stupid, negative modulo isn't a thing here
    let wrappedIndex = (focusedIndex - 1) % screens.length;
    if (wrappedIndex < 0) {
      wrappedIndex = screens.length - 1;
    }
    setFocusedScreenId(screens[wrappedIndex].id);
  }, [focusedIndex, screens]);

  // handle focusing on next screen in the filmstrip list
  const handleNext = useCallback(() => {
    if (screens.length === 0) {
      return;
    }
    const wrappedIndex = (focusedIndex + 1) % screens.length;
    setFocusedScreenId(screens[wrappedIndex].id);
  }, [focusedIndex, screens]);

  const handleDeleteScreen = useCallback(
    (screenId: string) => {
      const currentScreens = getValues("screens");
      const index = currentScreens.findIndex(
        (screen) => screen.id === screenId,
      );
      if (index < 0) {
        return;
      }

      const nextScreens = [...currentScreens];
      const [removedScreen] = nextScreens.splice(index, 1);
      if (!removedScreen) {
        return;
      }

      const currentGestures = getValues("gestures");
      const currentRedactions = getValues("redactions");
      const currentVHs = getValues("vhs") ?? {};

      const nextGestures = { ...currentGestures };
      const nextRedactions = { ...currentRedactions };
      const nextVHs = { ...currentVHs };

      delete nextGestures[removedScreen.id];
      delete nextRedactions[removedScreen.id];
      delete nextVHs[removedScreen.id];

      setValue("screens", nextScreens);
      setValue("gestures", nextGestures);
      setValue("redactions", nextRedactions);
      setValue("vhs", nextVHs);
      setFocusedScreenId(null);
    },
    [getValues, setValue],
  );

  useHotkeys(
    "left",
    (e) => {
      e.preventDefault();
      handlePrevious();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    "right",
    (e) => {
      e.preventDefault();
      handleNext();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    "tab",
    (e) => {
      e.preventDefault();
      handleNext();
    },
    { enableOnFormTags: false },
  );

  useHotkeys(
    "backspace",
    (event) => {
      event.preventDefault();
      if (focusedScreenId === null) {
        return;
      }
      handleDeleteScreen(focusedScreenId);
    },
    {
      enabled: focusedScreenId !== null,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      preventDefault: true,
    },
    [focusedScreenId, handleDeleteScreen],
  );

  // A checklist jump must apply exactly once per click. `screens` stays in the
  // deps so a jump requested before the screens finish loading still lands, but
  // it cannot be used to detect a *new* jump: react-hook-form broadcasts a deep
  // clone of the form on every write, so `useWatch` hands back a fresh `screens`
  // array on every keystroke. Without the nonce guard, each keystroke re-applied
  // the last jump and yanked focus off whatever screen was being edited.
  const appliedJumpNonceRef = useRef<number | null>(null);

  React.useEffect(() => {
    if (!jumpTarget) {
      return;
    }
    if (appliedJumpNonceRef.current === jumpTarget.nonce) {
      return;
    }

    const targetIndex = screens.findIndex(
      (screen) => screen.id === jumpTarget.screenId,
    );
    if (targetIndex >= 0) {
      appliedJumpNonceRef.current = jumpTarget.nonce;
      setFocusedScreenId(jumpTarget.screenId);
      // Move the recording to the same screen, matching what clicking the
      // filmstrip already does. Without this the playhead stays where it was,
      // and `c` would capture a frame from an unrelated part of the video —
      // which is exactly what the feedback often asks the worker to do.
      seekToTimeRef.current?.(screens[targetIndex].timestamp);
    }
  }, [jumpTarget, screens]);

  return (
    <NavigationProvider
      value={{
        handleNext,
        handlePrevious,
        handleDeleteScreen,
        focusedScreenId,
        setFocusedScreenId,
        focusedIndex,
        registerSeekToTime,
      }}
    >
      {(os.toLowerCase() as Platform) === Platform.ANDROID ? (
        <RepairScreenAndroid
          taskDescription={capture?.task?.description}
          files={files}
          os={os}
          draftFetchResult={draftFetchResult}
        />
      ) : (
        <RepairScreenIOS
          taskDescription={capture?.task?.description}
          files={files}
          os={os}
          draftFetchResult={draftFetchResult}
        />
      )}
    </NavigationProvider>
  );
}
