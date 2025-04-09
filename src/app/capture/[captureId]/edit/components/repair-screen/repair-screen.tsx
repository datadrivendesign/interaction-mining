"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { GlobalHotKeys } from "react-hotkeys";
import { CircleAlert } from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import {  ScreenGesture } from "@prisma/client";
import RepairScreenCanvas from "./repair-screen-canvas";
import { cn } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import { TraceFormData } from "../../page";
import { FrameData } from "../types";
import { GestureOptionsContext } from "../../util";

export default function RepairScreen() {
  const { watch } = useFormContext<TraceFormData>();
  const screens = watch("screens") as FrameData[];
  const gestures = watch("gestures") as { [key: string]: ScreenGesture };

  const [focusViewIndex, setFocusViewIndex] = useState<number>(-1);

  const keymap = {
    LEFT: "left",
    RIGHT: "right",
  };

  const handlePrevious = useCallback(() => {
    if (focusViewIndex > 0) {
      setFocusViewIndex(focusViewIndex - 1);
    }
  }, [focusViewIndex]);

  const handleNext = useCallback(() => {
    if (focusViewIndex < screens.length - 1) {
      setFocusViewIndex(focusViewIndex + 1);
    }
  }, [focusViewIndex, screens]);

  const handlers = {
    LEFT: handlePrevious,
    RIGHT: handleNext,
  };

  return (
    // @ts-ignore - GlobalHotKeys is not typed
    <div className="w-full h-[calc(100dvh-var(--nav-height))]">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={75}>
          <GlobalHotKeys
            key={focusViewIndex}
            keyMap={keymap}
            handlers={handlers}
          >
            {focusViewIndex > -1 ? (
              <FocusView
                key={focusViewIndex}
                screen={screens[focusViewIndex]}
              />
            ) : (
              <div className="flex justify-center items-center w-full h-full">
                <span className="text-3xl lg:text-4xl text-neutral-400 dark:text-neutral-500 font-semibold">
                  Select a screen from the filmstrip.
                </span>
              </div>
            )}
          </GlobalHotKeys>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={25} maxSize={50}>
          <Filmstrip
            screens={screens}
            gestures={gestures}
            focusViewIndex={focusViewIndex}
            setFocusViewIndex={setFocusViewIndex}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function FocusView({ screen }: { screen: FrameData }) {
  const { watch, setValue } = useFormContext<TraceFormData>();

  const gestures = watch("gestures") as { [key: string]: ScreenGesture };
  const { gestureOptions } = useContext(GestureOptionsContext);


  // Find applicable gesture for screen or set to default template
  const [gesture, setGesture] = useState<ScreenGesture>(
    gestures[screen.id] ?? {
      type: null,
      x: null,
      y: null,
      scrollDeltaX: 0,
      scrollDeltaY: 0,
    }
  );

  // Update gesture in form data
  useEffect(() => {
    setValue("gestures", {
      ...gestures,
      [screen.id]: gesture,
    });
  }, [gesture]);

  return (
    <>
      <div className="flex justify-center w-full h-full overflow-hidden">
        <RepairScreenCanvas
          key={screen.id}
          screen={screen}
          gesture={gesture}
          setGesture={setGesture}
          gestureOptions={gestureOptions}
        />
      </div>
    </>
  );
}

function Filmstrip({
  screens,
  gestures,
  focusViewIndex,
  setFocusViewIndex,
}: {
  screens: FrameData[];
  gestures: { [key: string]: ScreenGesture };
  focusViewIndex: number;
  setFocusViewIndex: (index: number) => void;
}) {
  
  return (
    <ul className="flex h-full px-2 pt-2 pb-4 gap-1 overflow-x-auto">
      {screens?.map((screen: FrameData, index: number) => (
        <FilmstripItem
          key={screen.id}
          index={index}
          isSelected={focusViewIndex === index}
          hasError={!gestures[screen.id] || 
            gestures[screen.id].type === null || 
            gestures[screen.id].description === undefined || 
            gestures[screen.id].description === ""} 
          onClick={() => setFocusViewIndex(index)}
        >
          <Image
            key={screen.id}
            src={screen.url}
            alt="gallery"
            draggable={false}
            className="h-full w-auto object-contain"
            width={0}
            height={0}
            sizes="100vw"
            onClick={() => setFocusViewIndex(index)}
          />
        </FilmstripItem>
      ))}
    </ul>
  );
}

function FilmstripItem({
  index = 0,
  children,
  isSelected,
  hasError = false,
  ...props
}: {
  index?: number;
  children?: React.ReactNode;
  isSelected?: boolean;
  hasError?: boolean;
} & React.HTMLAttributes<HTMLLIElement>) {
  return (
    <>
      <li
        className="cursor-pointer min-w-fit h-full"
        data-index={index}
        {...props}
      >
        <div className="relative h-full rounded-sm overflow-clip transition-all duration-200 ease-in-out select-none object-contain">
          {(isSelected || hasError) && (
            <div
              className={cn(
                "absolute z-10 flex w-full h-full justify-center items-center rounded-sm",
                isSelected
                  ? "ring-2 ring-inset ring-yellow-500"
                  : hasError
                    ? "ring-2 ring-inset ring-red-500"
                    : ""
              )}
            >
              {hasError && (
                <CircleAlert
                  className={cn(
                    "size-6",
                    isSelected ? "text-yellow-500" : "text-red-500"
                  )}
                />
              )}
            </div>
          )}
          <div
            className={cn(
              "relative min-w-fit h-full transition-all duration-200 ease-in-out select-none",
              hasError
                ? "grayscale brightness-50"
                : "grayscale-0 brightness-100"
            )}
          >
            {children}
          </div>
        </div>
      </li>
    </>
  );
}
