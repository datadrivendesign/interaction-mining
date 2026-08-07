"use client";
import React from "react";
import Image from "next/image";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { FrameData, Redaction } from "../../types";
import { countUnlabelledRedactions } from "../../../util";

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
    <ul className="relative z-0 flex h-full gap-1 overflow-x-auto px-2 pt-2 pb-4">
      {screens?.map((screen: FrameData, index: number) => (
        <FilmstripItem
          key={screen.id}
          index={index}
          screen={screen}
          redactions={redactions[screen.id] ?? []}
          isSelected={focusViewIndex === index}
          // Same predicate the step gate uses, so the screens ringed here are
          // exactly the screens its error names.
          hasError={countUnlabelledRedactions(redactions[screen.id]) > 0}
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
      className="h-full min-w-fit cursor-pointer"
      data-index={index}
      {...props}
    >
      <div className="relative h-full overflow-clip rounded-sm object-contain transition-all duration-200 ease-in-out select-none">
        {/* Index overlay */}
        <div className="absolute top-1 right-1 z-20 min-w-[1.5rem] rounded bg-black/60 px-1 py-0.5 text-center font-mono text-xs text-white">
          {index + 1}
        </div>
        {(isSelected || hasError) && (
          <div
            className={cn(
              "absolute z-10 flex h-full w-full items-center justify-center rounded-sm",
              isSelected
                ? "ring-3 ring-blue-500 ring-inset"
                : hasError
                  ? "ring-3 ring-red-500 ring-inset"
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
            "relative h-full min-w-fit transition-all duration-200 ease-in-out select-none",
            hasError ? "brightness-50 grayscale" : "brightness-100 grayscale-0",
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
