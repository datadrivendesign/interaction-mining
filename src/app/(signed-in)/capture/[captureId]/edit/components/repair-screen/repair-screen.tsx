"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { Redaction, TraceFormData } from "../types";
import { FrameData } from "../types";

export const gestureOptions = [
  {
    value: "tap",
    label: "Tap",
    icon: <Circle className="size-4 text-yellow-800 hover:text-black" />,
  },
  {
    value: "double tap",
    label: "Double tap",
    icon: <CircleDot className="size-4 text-yellow-800 hover:text-black" />,
  },
  {
    value: "touch and hold",
    label: "Touch and hold",
    icon: <CircleStop className="size-4 text-yellow-800 hover:text-black" />,
  },
  {
    value: "swipe",
    label: "Swipe",
    subGestures: [
      {
        value: "swipe up",
        label: "Swipe up",
        icon: (
          <ArrowUpFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "swipe down",
        label: "Swipe down",
        icon: (
          <ArrowDownFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "swipe left",
        label: "Swipe left",
        icon: (
          <ArrowLeftFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "swipe right",
        label: "Swipe right",
        icon: (
          <ArrowRightFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
    ],
  },
  {
    value: "drag",
    label: "Drag",
    icon: <Grab className="size-4 text-yellow-800 hover:text-black" />,
  },
  {
    value: "zoom",
    label: "Zoom",
    subGestures: [
      {
        value: "zoom in",
        label: "Zoom in",
        icon: <Shrink className="size-4 text-yellow-800 hover:text-black" />,
      },
      {
        value: "zoom out",
        label: "Zoom out",
        icon: <Expand className="size-4 text-yellow-800 hover:text-black" />,
      },
    ],
  },
  {
    value: "rotate",
    label: "Rotate",
    subGestures: [
      {
        value: "rotate cw",
        label: "Rotate clockwise",
        icon: (
          <IterationCw className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "rotate ccw",
        label: "Rotate counter-clockwise",
        icon: (
          <IterationCcw className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
    ],
  },
  {
    value: "other",
    label: "Other",
    icon: <CircleHelp className="size-4 text-yellow-800 hover:text-black" />,
  },
];

export default function RepairScreen({ capture }: { capture: any }) {
  const [watchScreens, watchVHs, watchGestures, watchRedactions] = useWatch({
    name: ["screens", "vhs", "gestures", "redactions"],
  });
  const screens = watchScreens as FrameData[];
  const vhs = watchVHs as { [key: string]: any };
  const gestures = watchGestures as { [key: string]: ScreenGesture };
  const redactions = watchRedactions as { [key: string]: Redaction[] };

  const os = capture?.task ? capture.task.os : "none";

  const [focusViewIndex, setFocusViewIndex] = useState<number>(-1);

  

  const keymap = {
    LEFT: "left",
    RIGHT: "right",
    TAB: "tab",
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

  const handleTab = useCallback(() => {
    const wrappedIndex = (focusViewIndex + 1) % screens.length;
    setFocusViewIndex(wrappedIndex);
  }, [focusViewIndex, screens]);

  const handlers = {
    LEFT: handlePrevious,
    RIGHT: handleNext,
    TAB: handleTab,
  };

  return (
    // @ts-ignore - GlobalHotKeys is not typed
    <div className="w-full h-full">
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
                isLastScreen={focusViewIndex === screens.length - 1}
                os={os}
              />
            ) : (
              <div className="flex justify-center items-center w-full h-full">
                <span className="text-3xl lg:text-4xl text-muted-foreground font-semibold">
                  Select a screen from the filmstrip.
                </span>
              </div>
            )}
          </GlobalHotKeys>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={20} minSize={20} maxSize={50}>
          <Filmstrip
            screens={screens}
            gestures={gestures}
            redactions={redactions}
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
  isLastScreen
}: {
  screen: FrameData;
  vh: any;
  os: string;
  isLastScreen: boolean
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
          isLastScreen={isLastScreen}
        />
      </div>
    </>
  );
}

function Filmstrip({
  screens,
  gestures,
  redactions,
  focusViewIndex,
  setFocusViewIndex,
}: {
  screens: FrameData[];
  gestures: { [key: string]: ScreenGesture };
  redactions: { [screenId: string]: Redaction[] };
  focusViewIndex: number;
  setFocusViewIndex: (index: number) => void;
}) {
  return (
    <ul className="flex h-full px-2 pt-2 pb-4 gap-1 overflow-x-auto">
      {screens?.map((screen: FrameData, index: number) => {
        const isLast = screens.length - 1 === index;
        return (
        <FilmstripItem
          key={screen.id}
          index={index}
          isLast={isLast}
          screen={screen}
          redactions={redactions[screen.id] ?? []}
          isSelected={focusViewIndex === index}
          hasError={
            !gestures[screen.id] ||
            gestures[screen.id].type === null ||
            gestures[screen.id].description === undefined ||
            gestures[screen.id].description === ""
          }
          onClick={() => setFocusViewIndex(index)}
        >
        </FilmstripItem>
        )
      })}
    </ul>
  );
}

function FilmstripItem({
  screen,
  redactions,
  index = 0,
  isLast = false,
  isSelected,
  hasError = false,
  // children,
  ...props
}: {
  screen: FrameData;
  redactions: Array<Redaction>;
  index?: number;
  isLast: boolean;
  isSelected?: boolean;
  hasError?: boolean;
  // children?: React.ReactNode;
} & React.HTMLAttributes<HTMLLIElement>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    scaleX: number;
    scaleY: number;
  }>({ width: 0, height: 0, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 });

  const updateSize = () => {
    if (containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const imageRect = imageRef.current.getBoundingClientRect();
      const naturalWidth = imageRef.current.naturalWidth;
      const naturalHeight = imageRef.current.naturalHeight;
      // Calculate the scale factor between the natural and displayed size:
      const scaleX = imageRect.width / naturalWidth;
      const scaleY = imageRect.height / naturalHeight;
      // Compute offsets in case the image is letterboxed inside its container:
      const offsetX = (containerRect.width - imageRect.width) / 2;
      const offsetY = (containerRect.height - imageRect.height) / 2;
      setImgDimensions({
        width: imageRect.width,
        height: imageRect.height,
        offsetX,
        offsetY,
        scaleX,
        scaleY,
      });
    }
  };

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <>
      <li
        className="cursor-pointer min-w-fit h-full"
        data-index={index}
        {...props}
      >
        <div 
          ref={containerRef}
          className="relative h-full rounded-sm overflow-clip transition-all duration-200 ease-in-out select-none object-contain"
        >
          {(isSelected || hasError) && !isLast && (
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
              hasError && !isLast
                ? "grayscale brightness-50"
                : "grayscale-0 brightness-100"
            )}
          >
            {/* {children} */}
            <Image
              ref={imageRef}
              key={screen.id}
              src={screen.src}
              alt="gallery"
              draggable={false}
              className="h-full w-auto object-contain"
              width={0}
              height={0}
              sizes="100vw"
            />
            {/* Render redaction overlays using the natural dimensions and scale factors */}
            {imgDimensions.width > 0 &&
              redactions.map((rect, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "absolute",
                    top:
                      imgDimensions.offsetY +
                      rect.y *
                        imageRef.current!.naturalHeight *
                        imgDimensions.scaleY,
                    left:
                      imgDimensions.offsetX +
                      rect.x *
                        imageRef.current!.naturalWidth *
                        imgDimensions.scaleX,
                    width:
                      rect.width *
                      imageRef.current!.naturalWidth *
                      imgDimensions.scaleX,
                    height:
                      rect.height *
                      imageRef.current!.naturalHeight *
                      imgDimensions.scaleY,
                    backgroundColor: "black",
                    border: "1px solid black",
                  }}
                />
              ))}
          </div>
        </div>
      </li>
    </>
  );
}
