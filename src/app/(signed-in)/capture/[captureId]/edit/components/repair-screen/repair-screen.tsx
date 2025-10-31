"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

import { Platform } from "@/lib/utils";
import { useWatch } from "react-hook-form";
import { FrameData } from "../types";

import { useHotkeys } from "react-hotkeys-hook";
import { RepairScreenAndroid } from "./components/android/repair-screen-android";
import { RepairScreenIOS } from "./components/ios/repair-screen-ios";
import { Prisma } from "@prisma/client";
import { DraftFetchResults } from "../../util";
import { ListedFiles } from "@/lib/actions";

interface NavigationContextType {
  handleNext: () => void;
  handlePrevious: () => void;
  focusViewIndex: number;
  setFocusViewIndex: (index: number) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
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
  const [watchScreens] = useWatch({
    name: ["screens"],
  });
  const screens = watchScreens as FrameData[];

  const os = capture?.task ? capture.task.os : "none";
  const [focusViewIndex, setFocusViewIndex] = useState<number>(-1);

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
    const wrappedIndex = (focusViewIndex + 1) % screens.length;
    setFocusViewIndex(wrappedIndex);
  }, [focusViewIndex, screens.length]);

  useHotkeys("left", (e) => {
    e.preventDefault();
    handlePrevious();
  });

  useHotkeys("right", (e) => {
    e.preventDefault();
    handleNext();
  });

  useHotkeys("tab", (e) => {
    e.preventDefault();
    handleNext();
  });

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
