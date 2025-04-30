"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { GlobalHotKeys } from "react-hotkeys";
import {
  ArrowDownFromLine,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  ArrowUpFromLine,
  Circle,
  CircleAlert,
  CircleDot,
  CircleHelp,
  CircleStop,
  Expand,
  Grab,
  IterationCcw,
  IterationCw,
  Shrink,
} from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { ScreenGesture } from "@prisma/client";
import RepairScreenCanvas from "./repair-screen-canvas";
import { cn } from "@/lib/utils";
import { useFormContext, useWatch } from "react-hook-form";
import { TraceFormData } from "../types";
import { FrameData } from "../types";

export   const gestureOptions = [
  {
    value: "Tap",
    label: "Tap",
    icon: <Circle className="size-4 text-yellow-800 hover:text-black" />,
  },
  {
    value: "Double tap",
    label: "Double tap",
    icon: <CircleDot className="size-4 text-yellow-800 hover:text-black" />,
  },
  {
    value: "Touch and hold",
    label: "Touch and hold",
    icon: (
      <CircleStop className="size-4 text-yellow-800 hover:text-black" />
    ),
  },
  {
    value: "Swipe",
    label: "Swipe",
    subGestures: [
      {
        value: "Swipe up",
        label: "Swipe up",
        icon: (
          <ArrowUpFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "Swipe down",
        label: "Swipe down",
        icon: (
          <ArrowDownFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "Swipe left",
        label: "Swipe left",
        icon: (
          <ArrowLeftFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "Swipe right",
        label: "Swipe right",
        icon: (
          <ArrowRightFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
    ],
  },
  {
    value: "Drag",
    label: "Drag",
    icon: <Grab className="size-4 text-yellow-800 hover:text-black" />,
  },
  {
    value: "Zoom",
    label: "Zoom",
    subGestures: [
      {
        value: "Zoom in",
        label: "Zoom in",
        icon: (
          <Shrink className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "Zoom out",
        label: "Zoom out",
        icon: (
          <Expand className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
    ],
  },
  {
    value: "Rotate",
    label: "Rotate",
    subGestures: [
      {
        value: "Rotate cw",
        label: "Rotate cw",
        icon: (
          <IterationCw className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "Rotate ccw",
        label: "Rotate ccw",
        icon: (
          <IterationCcw className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
    ],
  },
  {
    value: "Other",
    label: "Other",
    icon: (
      <CircleHelp className="size-4 text-yellow-800 hover:text-black" />
    ),
  },
];

export default function RepairScreen({ capture }: { capture: any }) {
  const [watchScreens, watchVHs, watchGestures] = useWatch({
    name: ["screens", "vhs", "gestures"],
  });
  const screens = watchScreens as FrameData[];
  const vhs = watchVHs as { [key: string]: any };
  const gestures = watchGestures as { [key: string]: ScreenGesture };
  const os = capture?.task ? capture.task.os : "none";

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
                vh={vhs[screens[focusViewIndex].id]}
                screen={screens[focusViewIndex]}
                os={os}
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

function FocusView({
  screen,
  vh,
  os,
}: {
  screen: FrameData;
  vh: any;
  os: string;
}) {
  const { watch, setValue } = useFormContext<TraceFormData>();

  const gestures = watch("gestures") as { [key: string]: ScreenGesture };

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
    // only update if gesture has changed
    const currentGesture = gestures[screen.id];
    // dumb way to do object equality but pay the price to fix linter error
    if (JSON.stringify(currentGesture) !== JSON.stringify(gesture)) {
      setValue("gestures", {
        ...gestures,
        [screen.id]: gesture,
      });
    }
  }, [gesture, gestures, screen.id, setValue]);

  return (
    <>
      <div className="flex justify-center w-full h-full overflow-hidden">
        <RepairScreenCanvas
          key={screen.id}
          screen={screen}
          vh={vh}
          gesture={gesture}
          setGesture={setGesture}
          gestureOptions={gestureOptions}
          os={os}
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
          hasError={
            !gestures[screen.id] ||
            gestures[screen.id].type === null ||
            gestures[screen.id].description === undefined ||
            gestures[screen.id].description === ""
          }
          onClick={() => setFocusViewIndex(index)}
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
