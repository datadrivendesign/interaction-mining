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
import { Prisma } from "@prisma/client";
import { DraftFetchResults } from "../../util";
import { ListedFiles } from "@/lib/actions";

export interface RepairScreenJumpTarget {
  nonce: number;
  screenId: string;
}

/**
 * Stable fallback for the watched screens list. A fresh `[]` literal would
 * change identity every render and defeat every dependency array that reads it.
 */
const EMPTY_SCREENS: FrameData[] = [];

/**
 * What caused a screen to be selected. Determines whether the recording follows,
 * so that policy lives in one readable place instead of being spread across call
 * sites — which is how the filmstrip ended up seeking one way and the feedback
 * checklist another.
 */
export type SelectScreenSource =
  /** A feedback checklist chip. Explicitly "take me to this screen". */
  | "jump"
  /** A click on a filmstrip thumbnail. Also explicit. */
  | "filmstrip"
  /** Tab or the arrow keys, stepping through screens while annotating. */
  | "keyboard"
  /** A frame the worker just captured. */
  | "capture"
  /** The selected screen was removed, so nothing is selected. */
  | "delete"
  /** Derived from the playhead — the recording moved first, so it must not move again. */
  | "playhead";

/**
 * Sources that carry the recording to the selected screen.
 *
 * Deliberately excludes `keyboard`: workers tab through screens quickly while
 * annotating, and seeking on every step would churn the video and its preview
 * frames. Excludes `capture` because the playhead is already there, and
 * `playhead` because that selection came *from* the recording — moving it again
 * is the feedback loop that let a click land on a neighbouring screen.
 */
const SOURCES_THAT_MOVE_PLAYHEAD: ReadonlySet<SelectScreenSource> = new Set([
  "jump",
  "filmstrip",
]);

/** A request to place the recording's playhead, applied once per nonce. */
export interface PlayheadRequest {
  time: number;
  nonce: number;
}

interface NavigationContextType {
  handleNext: () => void;
  handlePrevious: () => void;
  handleDeleteScreen: (screenId: string) => void;
  /**
   * The focused screen, identified by id. Authoritative — inserting or deleting
   * a screen shifts positions, so an index cannot survive an edit to the trace.
   */
  focusedScreenId: string | null;
  /**
   * Focus a screen, declaring why. The reason decides whether the recording
   * follows; see `SOURCES_THAT_MOVE_PLAYHEAD`.
   */
  selectScreen: (screenId: string | null, source: SelectScreenSource) => void;
  /**
   * Position of the focused screen in the sorted list, derived from
   * `focusedScreenId`. Provided here so ordering questions ("is this the last
   * screen?", "what is next?") have one answer rather than one per consumer.
   * `-1` when nothing is focused or the focused screen no longer exists.
   */
  focusedIndex: number;
  /**
   * Where the recording has been asked to sit, or `null` if nothing has asked.
   *
   * Desired state rather than an imperative call: a platform that owns a
   * recording reconciles towards it whenever it is able to, so a request made
   * while the video is still loading is applied when loading finishes instead of
   * being lost. Platforms without a recording ignore it.
   */
  playheadRequest: PlayheadRequest | null;
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
  const [playheadRequest, setPlayheadRequest] =
    useState<PlayheadRequest | null>(null);
  const playheadNonceRef = useRef(0);
  const focusedIndex = useMemo(
    () =>
      focusedScreenId === null
        ? -1
        : screens.findIndex((screen) => screen.id === focusedScreenId),
    [focusedScreenId, screens],
  );

  /**
   * Every selection goes through here, so "does the recording follow?" is
   * answered once, from the reason, rather than at each call site.
   */
  const selectScreen = useCallback(
    (screenId: string | null, source: SelectScreenSource) => {
      setFocusedScreenId(screenId);

      if (screenId === null || !SOURCES_THAT_MOVE_PLAYHEAD.has(source)) {
        return;
      }
      const screen = screens.find((candidate) => candidate.id === screenId);
      if (!screen) {
        return;
      }
      // A nonce rather than the timestamp alone: re-selecting the same screen has
      // to re-place the playhead, and the value has to differ for the reconciler
      // to notice.
      playheadNonceRef.current += 1;
      setPlayheadRequest({
        time: screen.timestamp,
        nonce: playheadNonceRef.current,
      });
    },
    [screens],
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
    selectScreen(screens[wrappedIndex].id, "keyboard");
  }, [focusedIndex, screens, selectScreen]);

  // handle focusing on next screen in the filmstrip list
  const handleNext = useCallback(() => {
    if (screens.length === 0) {
      return;
    }
    const wrappedIndex = (focusedIndex + 1) % screens.length;
    selectScreen(screens[wrappedIndex].id, "keyboard");
  }, [focusedIndex, screens, selectScreen]);

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
      selectScreen(null, "delete");
    },
    [getValues, selectScreen, setValue],
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

    const targetScreen = screens.find(
      (screen) => screen.id === jumpTarget.screenId,
    );
    if (targetScreen) {
      appliedJumpNonceRef.current = jumpTarget.nonce;
      // "jump" carries the recording with it, so the worker lands on the screen
      // *and* the moment it came from — `c` would otherwise capture a frame from
      // wherever the playhead was left.
      selectScreen(targetScreen.id, "jump");
    }
  }, [jumpTarget, screens, selectScreen]);

  return (
    <NavigationProvider
      value={{
        handleNext,
        handlePrevious,
        handleDeleteScreen,
        focusedScreenId,
        selectScreen,
        focusedIndex,
        playheadRequest,
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
