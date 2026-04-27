"use client";
import React from "react";
import Image from "next/image";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { FrameData, Redaction } from "../../types";

export function Filmstrip({
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
    <ul className="relative z-0 flex h-full px-2 pt-2 pb-4 gap-1 overflow-x-auto">
      {screens?.map((screen: FrameData, index: number) => (
        <FilmstripItem
          key={screen.id}
          index={index}
          screen={screen}
          redactions={redactions[screen.id] ?? []}
          isSelected={focusViewIndex === index}
          onClick={() => setFocusViewIndex(index)}
        ></FilmstripItem>
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
  children,
  ...props
}: {
  screen: FrameData;
  redactions: Array<Redaction>;
  index?: number;
  isSelected?: boolean;
  hasError?: boolean;
} & React.HTMLAttributes<HTMLLIElement>) {
  return (
    <li
      className="cursor-pointer min-w-fit h-full"
      data-index={index}
      {...props}
    >
      <div className="relative h-full rounded-sm overflow-clip transition-all duration-200 ease-in-out select-none object-contain">
        {/* Index overlay */}
        <div className="absolute top-1 right-1 z-20 bg-black/60 text-white text-xs font-mono rounded px-1 py-0.5 min-w-[1.5rem] text-center">
          {index + 1}
        </div>
        {(isSelected || hasError) && (
          <div
            className={cn(
              "absolute z-10 flex w-full h-full justify-center items-center rounded-sm",
              isSelected
                ? "ring-2 ring-inset ring-yellow-500"
                : hasError
                  ? "ring-2 ring-inset ring-red-500"
                  : "",
            )}
          >
            {hasError && (
              <CircleAlert
                className={cn(
                  "size-6",
                  isSelected ? "text-yellow-500" : "text-red-500",
                )}
              />
            )}
          </div>
        )}
        <div
          className={cn(
            "relative min-w-fit h-full transition-all duration-200 ease-in-out select-none",
            hasError ? "grayscale brightness-50" : "grayscale-0 brightness-100",
          )}
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
          />
          {/* Render redaction overlays in normalized image coordinates */}
          {redactions.map((rect, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute",
                top: `${rect.y * 100}%`,
                left: `${rect.x * 100}%`,
                width: `${rect.width * 100}%`,
                height: `${rect.height * 100}%`,
                backgroundColor: "black",
                border: "1px solid black",
              }}
            />
          ))}
        </div>
      </div>
    </li>
  );
}
