"use client";
import React, {
  useCallback,
  useState,
} from "react";
import Image from "next/image";
import clsx from "clsx";
import { CircleAlert } from "lucide-react";

import { TraceWithAppsScreens as Trace } from "@/lib/actions";

export default function RepairScreen({
  data
}: {
  data: Trace
}) {
  const [viewMode, setViewMode] = useState<"gallery" | "focus">("gallery");

  return (
    <>
      {viewMode === "gallery" && (
        <ul className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 grow w-full">
          {data.screens?.map((screen, index) => (
            <RepairScreenItem
              key={screen.id}
              index={index}
              isBroken={screen.gesture === null}
            >
              <div className="relative w-full h-full bg-neutral-900">
                <Image
                  src={screen.src}
                  alt="gallery"
                  draggable={false}
                  className="z-0 object-cover w-full h-auto"
                  width={0}
                  height={0}
                  sizes="100vw"
                />
              </div>
            </RepairScreenItem>
          ))}
        </ul>)
      }

      {viewMode === "focus" && (
        <></>
      )}
    </>
  );
}


export function RepairScreenItem({
  index = 0,
  children,
  isBroken = false,
}: {
  index?: number;
  children?: React.ReactNode;
  isBroken?: boolean;
}) {
  console.log(isBroken);

  return (
    <li
      className="p-2"
      data-index={index}
    >
      <div
        className={clsx(
          "relative w-full h-full rounded-lg overflow-clip transition-all duration-200 ease-in-out select-none",
          isBroken
            ? "outline-3 outline-red-400"
            : ""
        )}
      >
        {(isBroken) && (
          <div className="absolute z-10 top-2 right-2 flex size-6">
            <CircleAlert className="size-6 text-red-500" />
          </div>
        )}
        <div className={clsx("relative w-full h-full rounded-lg overflow-clip transition-all duration-200 ease-in-out select-none", isBroken ? "grayscale" : "grayscale-0")}>
          {children}
        </div>
      </div>
    </li >
  );
}