"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useFormContext } from "react-hook-form";
import { TraceFormData } from "../types";
import { Screen } from "@prisma/client";

export default function RedactScreen() {
  const { getValues } = useFormContext<TraceFormData>();
  const screens = getValues("screens") as Screen[];
  const redactions = getValues("redactions") as {
    [screenId: string]: Redaction[];
  };

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

  const handleTab = useCallback(() => {
    const wrappedIndex = (focusViewIndex + 1) % screens.length;
    setFocusViewIndex(wrappedIndex);
  }, [focusViewIndex, screens]);

  useHotkeys("left", (e) => {
    e.preventDefault();
    handlePrevious();
  })

  useHotkeys("right", (e) => {
    e.preventDefault();
    handleNext();
  })

  useHotkeys("tab", (e) => {
    e.preventDefault();
    handleTab();
  })

  return (
    <div className="w-full h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={75}>
            {focusViewIndex > -1 ? (
              <FocusView
                key={focusViewIndex}
                screen={screens[focusViewIndex]}
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
        <ResizablePanel defaultSize={25} minSize={25} maxSize={50}>
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

function FocusView({ screen }: { screen: Screen }) {
  return (
    <>
      <div className="flex justify-center w-full h-full overflow-hidden border border-t border-neutral-200 dark:border-neutral-800">
        <RedactScreenCanvas screen={screen} />
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
  screens: Screen[];
  redactions: { [screenId: string]: Redaction[] };
  focusViewIndex: number;
  setFocusViewIndex: (index: number) => void;
}) {
  return (
    <ul className="flex h-full px-2 pt-2 pb-4 gap-1 overflow-x-auto">
      {screens?.map((screen: Screen, index: number) => (
        <FilmstripItem
          key={screen.id}
          index={index}
          screen={screen}
          redactions={redactions[screen.id] ?? []}
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
  redactions,
  index = 0,
  isSelected = false,
  hasError = false,
  ...props
}: {
  screen: Screen;
  redactions: Array<Redaction>;
  index?: number;
  isSelected?: boolean;
  hasError?: boolean;
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
    <li
      className="cursor-pointer min-w-fit h-full relative"
      data-index={index}
      {...props}
    >
      <div
        ref={containerRef}
        className="relative h-full rounded-sm overflow-clip transition-all duration-200 ease-in-out select-none"
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
        <Image
          ref={imageRef}
          src={screen.src}
          alt="gallery"
          draggable={false}
          className="h-full w-auto object-contain"
          onLoad={updateSize}
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
    </li>
  );
}
