"use client";
import React, {
  useCallback,
  useState,
} from "react";
import clsx from "clsx";
import { CircleAlert } from "lucide-react";

export default function RedactScreen({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode
}) {


  return (
    <>
      <ul className={clsx("grid grid-cols-3", className)}>
        {children}
      </ul>
    </>
  );
}


export function RedactScreenItem({
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
            ? "outline outline-[3] outline-red-400"
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