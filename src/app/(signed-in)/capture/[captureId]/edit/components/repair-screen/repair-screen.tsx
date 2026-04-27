"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
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

interface NavigationContextType {
  handleNext: () => void;
  handlePrevious: () => void;
  handleDeleteScreen: (index: number) => void;
  focusViewIndex: number;
  setFocusViewIndex: (index: number) => void;
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
  const [watchScreens, watchGestures] = useWatch({
    name: ["screens", "gestures"],
  });
  const screens = watchScreens as FrameData[];
  const gestures = useMemo(
    () => (watchGestures ?? {}) as { [key: string]: ScreenGesture },
    [watchGestures],
  );

  const os = capture?.task ? capture.task.os : "none";
  const [focusViewIndex, setFocusViewIndex] = useState<number>(-1);

  // UI-level guard for keyboard/arrow navigation so users cannot leave a screen
  // with incomplete required template fields. Matches validateGestureDescription
  // used by filmstrip and form schema.
  const canAdvanceFromCurrentScreen = useCallback(() => {
    if (focusViewIndex < 0 || focusViewIndex >= screens.length) {
      return true;
    }
    // Last screen does not require a gesture.
    if (focusViewIndex === screens.length - 1) {
      return true;
    }
    const currentScreen = screens[focusViewIndex];
    const currentGesture = gestures[currentScreen.id];
    return validateGestureDescription(
      currentGesture ?? { type: null, description: "" },
    );
  }, [focusViewIndex, gestures, screens]);

  // handle focusing on previous screen in the filmstrip list
  const handlePrevious = useCallback(() => {
    if (screens.length === 0) {
      return;
    }
    // javascript be stupid, negative modulo isn't a thing here
    let wrappedIndex = (focusViewIndex - 1) % screens.length;
    if (wrappedIndex < 0) {
      wrappedIndex = screens.length - 1;
    }
    setFocusViewIndex(wrappedIndex);
  }, [focusViewIndex, screens.length]);

  // handle focusing on next screen in the filmstrip list
  const handleNext = useCallback(() => {
    if (screens.length === 0) {
      return;
    }
    if (!canAdvanceFromCurrentScreen()) {
      return;
    }
    const wrappedIndex = (focusViewIndex + 1) % screens.length;
    setFocusViewIndex(wrappedIndex);
  }, [canAdvanceFromCurrentScreen, focusViewIndex, screens.length]);

  const handleDeleteScreen = useCallback(
    (index: number) => {
      const currentScreens = getValues("screens");
      if (index < 0 || index >= currentScreens.length) {
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
      setFocusViewIndex(-1);
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
      handleDeleteScreen(focusViewIndex);
    },
    {
      enabled: focusViewIndex >= 0,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      preventDefault: true,
    },
    [focusViewIndex, handleDeleteScreen],
  );

  React.useEffect(() => {
    if (!jumpTarget) {
      return;
    }

    const targetIndex = screens.findIndex(
      (screen) => screen.id === jumpTarget.screenId,
    );
    if (targetIndex >= 0) {
      setFocusViewIndex(targetIndex);
    }
  }, [jumpTarget, screens]);

  return (
    <NavigationProvider
      value={{
        handleNext,
        handlePrevious,
        handleDeleteScreen,
        focusViewIndex,
        setFocusViewIndex,
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
