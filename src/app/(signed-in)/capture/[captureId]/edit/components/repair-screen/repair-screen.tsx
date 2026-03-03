"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { Platform } from "@/lib/utils";
import { useWatch } from "react-hook-form";
import { FrameData } from "../types";

import { useHotkeys } from "react-hotkeys-hook";
import { RepairScreenAndroid } from "./components/android/repair-screen-android";
import { RepairScreenIOS } from "./components/ios/repair-screen-ios";
import { Prisma, ScreenGesture } from "@prisma/client";
import { DraftFetchResults } from "../../util";
import { ListedFiles } from "@/lib/actions";
import { validateGestureDescription } from "./util";

interface NavigationContextType {
  handleNext: () => void;
  handlePrevious: () => void;
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
}) {
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
    // javascript be stupid, negative modulo isn't a thing here
    let wrappedIndex = (focusViewIndex - 1) % screens.length;
    if (wrappedIndex < 0) {
      wrappedIndex = screens.length - 1;
    }
    setFocusViewIndex(wrappedIndex);
  }, [focusViewIndex, screens.length]);

  // handle focusing on next screen in the filmstrip list
  const handleNext = useCallback(() => {
    if (!canAdvanceFromCurrentScreen()) {
      return;
    }
    const wrappedIndex = (focusViewIndex + 1) % screens.length;
    setFocusViewIndex(wrappedIndex);
  }, [canAdvanceFromCurrentScreen, focusViewIndex, screens.length]);

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

  return (
    <NavigationProvider
      value={{
        handleNext,
        handlePrevious,
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
