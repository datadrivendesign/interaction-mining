"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

import { Platform } from "@/lib/utils";
import { useWatch } from "react-hook-form";
import { FrameData } from "../types";

import useSWR from "swr";
import { useHotkeys } from "react-hotkeys-hook";
import { fileFetcher, getSWRConfig } from "./util";
import { RepairScreenAndroid } from "./repair-screen-android";
import { RepairScreenIOS } from "./repair-screen-ios";

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

export default function RepairScreen({ capture }: { capture: any }) {
  const [watchScreens] = useWatch({
    name: ["screens"],
  });
  const screens = watchScreens as FrameData[];

  const os = capture?.task ? capture.task.os : "none";
  const [focusViewIndex, setFocusViewIndex] = useState<number>(-1);

  const handlePrevious = useCallback(() => {
    // javascript be stupid, negative modulo isn't a thing here
    let wrappedIndex = (focusViewIndex - 1) % screens.length;
    if (wrappedIndex < 0) {
      wrappedIndex = screens.length - 1;
    }
    setFocusViewIndex(wrappedIndex);
  }, [focusViewIndex, screens.length]);

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

  // Fetch file data
  const { data: files = [], isLoading: isFilesLoading } = useSWR(
    capture.id ? ["Capture files", `processed/${capture.id}`] : null,
    fileFetcher,
    getSWRConfig(capture.id)
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
        <RepairScreenAndroid capture={capture} files={files} os={os} />
      ) : (
        <RepairScreenIOS capture={capture} files={files} os={os} />
      )}
    </NavigationProvider>
  );
}
