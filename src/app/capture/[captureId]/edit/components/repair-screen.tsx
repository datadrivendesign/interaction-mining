"use client";
import React, {
  use,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { CircleAlert } from "lucide-react";

import { GlobalHotKeys, HotKeys } from "react-hotkeys";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { Screen, ScreenGesture } from "@prisma/client";
import { cn } from "@/lib/utils";

import RepairScreenCanvas from "./repair-screen-canvas";
import { FormContext } from "./controller";

type Trace = any;

export default function RepairScreen({ screens }: { screens: Screen[] }) {
  const [focusViewIndex, setFocusViewIndex] = useState<number>(-1);

  const keymap = {
    LEFT: "left",
    RIGHT: "right",
  };

  const handlePrevious = useCallback(() => {
    if (focusViewIndex > 0) {
      console.log("going previous", focusViewIndex - 1);
      setFocusViewIndex(focusViewIndex - 1);
    }
  }, [focusViewIndex]);

  const handleNext = useCallback(() => {
    if (focusViewIndex < screens.length - 1) {
      console.log("going next", focusViewIndex + 1);
      setFocusViewIndex(focusViewIndex + 1);
    }
  }, [focusViewIndex, screens]);

  const handlers = {
    LEFT: handlePrevious,
    RIGHT: handleNext,
  };

  useEffect(() => {
    console.log("focusViewIndex", focusViewIndex);
  }, [focusViewIndex]);

  return (
    // @ts-ignore - GlobalHotKeys is not typed
    <div className="w-full h-[calc(100dvh-var(--nav-height))]">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={75}>
          <GlobalHotKeys keyMap={keymap} handlers={handlers} allowChanges>
            {focusViewIndex > -1 ? (
              <FocusView
                key={focusViewIndex}
                screen={screens[focusViewIndex]}
              />
            ) : (
              <div className="flex justify-center items-center w-full h-full">
                <span className="text-3xl lg:text-4xl text-neutral-500 dark:text-neutral-400 font-semibold">
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
            handleFocusView={(index) => setFocusViewIndex(index)}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function Filmstrip({
  screens,
  handleFocusView,
}: {
  screens: Screen[];
  handleFocusView: (index: number) => void;
}) {
  return (
    <ul className="flex h-full px-2 pt-2 pb-4 gap-1 overflow-x-auto">
      {screens?.map((screen: Screen, index: number) => (
        <FilmstripItem
          key={screen.id}
          index={index}
          isBroken={screen.gesture.type === null}
          onClick={() => handleFocusView(index)}
        >
          <Image
            key={screen.id}
            src={screen.src}
            alt="gallery"
            draggable={false}
            className="h-full w-auto object-contain"
            width={0}
            height={0}
            sizes="100vw"
            onClick={() => handleFocusView(index)}
          />
        </FilmstripItem>
      ))}
    </ul>
  );
}

function FilmstripItem({
  index = 0,
  children,
  isBroken = false,
  ...props
}: {
  index?: number;
  children?: React.ReactNode;
  isBroken?: boolean;
} & React.HTMLAttributes<HTMLLIElement>) {
  return (
    <>
      <li
        className="cursor-pointer min-w-fit h-full"
        data-index={index}
        {...props}
      >
        <div className="relative h-full rounded-sm overflow-clip transition-all duration-200 ease-in-out select-none object-contain">
          {isBroken && (
            <div className="absolute z-10 flex w-full h-full justify-center items-center rounded-sm ring-2 ring-inset ring-red-500 dark:ring-red-400">
              <CircleAlert className="size-6 text-red-500 dark:text-red-400" />
            </div>
          )}
          <div
            className={cn(
              "relative min-w-fit h-full transition-all duration-200 ease-in-out select-none",
              isBroken
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

function FocusView({ screen }: { screen: Screen }) {
  const { screens, setEdits } = useContext(FormContext);
  // find applicable gesture for screen or set to default template
  const [gesture, setGesture] = useState<ScreenGesture>(
    screens.find((s) => s.id === screen.id)?.gesture ?? {
      type: null,
      x: null,
      y: null,
      scrollDeltaX: null,
      scrollDeltaY: null,
    }
  );

  useEffect(() => {
    setEdits((prev) => ({
      ...prev,
      gestures: {
        ...prev.gestures,
        [screen.id]: gesture,
      },
    }));
  }, [gesture]);

  return (
    <>
      <div className="flex justify-center w-full h-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <RepairScreenCanvas
          key={screen.id}
          screen={screen}
          gesture={gesture}
          setGesture={setGesture}
        />
      </div>
    </>
  );
}
