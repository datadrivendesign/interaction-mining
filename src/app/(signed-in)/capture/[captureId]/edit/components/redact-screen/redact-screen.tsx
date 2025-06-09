"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { CircleAlert } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { cn } from "@/lib/utils";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import RedactScreenCanvas from "./redact-screen-canvas";
import { Redaction } from "../types";
import { useFormContext, useWatch } from "react-hook-form";
import { TraceFormData } from "../types";
import { FrameData } from "../types";

export default function RedactScreen() {
  const { getValues } = useFormContext<TraceFormData>();
  const screens = getValues("screens") as FrameData[];
  const redactions = getValues("redactions") as {
    [screenId: string]: Redaction[];
  };
  // TODO: pass vh by watch, then pass by prop in readct-screen-canvas
  const vhs = getValues("vhs") as { [key: string]: any };

  const [focusViewIndex, setFocusViewIndex] = useState<number>(-1);

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

  useHotkeys("left", handlePrevious);
  useHotkeys("right", handleNext);

  return (
    <div className="flex w-full h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={75}>
          {focusViewIndex > -1 ? (
            <FocusView
              key={focusViewIndex}
              screen={screens[focusViewIndex]}
              vh={vhs[screens[focusViewIndex].id]}
            />
          ) : (
            <div className="flex justify-center items-center w-full h-full">
              <span className="text-3xl lg:text-4xl text-muted-foreground font-semibold">
                Select a screen from the filmstrip.
              </span>
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={20} minSize={20} maxSize={50}>
          <Filmstrip
            screens={screens}
            redactions={redactions}
            focusViewIndex={focusViewIndex}
            setFocusViewIndex={setFocusViewIndex}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function FocusView({ screen, vh }: { screen: FrameData; vh: any }) {
  return (
    <>
      <div className="flex justify-center w-full h-full overflow-hidden">
        <RedactScreenCanvas screen={screen} vh={vh} />
      </div>
    </>
  );
}

function Filmstrip({
  screens,
  redactions,
  focusViewIndex,
  setFocusViewIndex,
}: {
  screens: FrameData[];
  redactions: { [screenId: string]: Redaction[] };
  focusViewIndex: number;
  setFocusViewIndex: (index: number) => void;
}) {
  return (
    <ul className="flex h-full px-2 pt-2 pb-4 gap-1 overflow-x-auto">
      {screens?.map((screen: FrameData, index: number) => (
        <FilmstripItem
          key={screen.id}
          index={index}
          screen={screen}
          isSelected={focusViewIndex === index}
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
  screen,
  index = 0,
  isSelected = false,
  hasError = false,
  children,
  ...props
}: {
  screen: FrameData;
  index?: number;
  isSelected?: boolean;
  hasError?: boolean;
} & React.HTMLAttributes<HTMLLIElement>) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <li
      className="cursor-pointer min-w-fit h-full"
      data-index={index}
      {...props}
    >
      <div
        ref={containerRef}
        className="relative h-full rounded-sm overflow-clip transition-all duration-200 ease-in-out select-none object-contain"
      >
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
            hasError ? "grayscale brightness-50" : "grayscale-0 brightness-100"
          )}
        >
          {children}
        </div>
      </div>
    </li>
  );
}
