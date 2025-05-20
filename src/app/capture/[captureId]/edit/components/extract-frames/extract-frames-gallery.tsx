"use client";

import Image from "next/image";
import React from "react";
import { prettyNumber } from "@/lib/utils/number";
import { X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Redaction, TraceFormData } from "../types";
import { FrameData } from "../types";
import { ScreenGesture } from "@prisma/client";

export function FrameGalleryAndroid({
  frames,
  vhs,
  gestures,
  redactions
}: {
  frames: FrameData[];
  vhs: { [key: string]: any };
  gestures: { [key: string]: ScreenGesture };
  redactions: { [key:string]: Redaction[] }
}) {
  const { setValue } = useFormContext<TraceFormData>();

  const setFrameData = (value: FrameData[]) => setValue("screens", value);

  const handleDeleteFrame = (index: number) => {
    // remove frame from view
    const newFrameData = [...frames];
    newFrameData.splice(index, 1);
    setFrameData(newFrameData);
    // remove frame from vhs
    const updatedVHs = Object.fromEntries(
      Object.entries(vhs).filter(([key]) => key !== frames[index].id)
    );
    setValue("vhs", updatedVHs);
    // remove frame from gestures
    const updatedGestures = Object.fromEntries(
      Object.entries(gestures).filter(([key]) => key !== frames[index].id)
    );
    setValue("gestures", updatedGestures);
    // TODO: remove frame from redactions
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 items-start w-full h-full gap-6 p-6 overflow-auto">
      {frames.map((frame, index) => (
        <div
          className="flex flex-col p-2 bg-neutral-100 dark:bg-neutral-900 rounded-xl"
          key={`${frame.timestamp}-${index}`}
        >
          {/* Toolbar */}
          <div className="flex flex-row w-full items-center justify-between mb-2">
            <div
              className="group flex p-1 justify-center items-center bg-neutral-800 rounded-lg"
            >
              <span
                className="text-sm text-neutral-500 dark:text-neutral-400 tracking-tight leading-none slashed-zero tabular-nums group-hover:underline cursor-pointer"
              >
                {`${(new Date(frame.timestamp)).toISOString()}`}
              </span>
            </div>
            <button
              onClick={() => handleDeleteFrame(index)}
              className="inline-flex self-end items-center cursor-pointer"
              title="Delete snapshot"
            >
              <X className="size-6 text-neutral-500 dark:text-neutral-400 hover:opacity-75" />
            </button>
          </div>

          <div
            className="relative flex flex-col bg-neutral-100 dark:bg-neutral-900 rounded-xl"
            key={`${frame.id}`}
          >
            <Image
              className="z-0 object-cover w-full h-auto rounded-lg"
              src={frame.src}
              alt={`Extracted frame at ${frame.timestamp}`}
              draggable={false}
              width={0}
              height={0}
              sizes="100vw"
            />

            {/* Render redaction overlays using the natural dimensions and scale factors */}
            {(redactions[frame.id] ?? []).map((rect, idx) => (
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
      ))}
    </div>
  );
}

export function FrameGalleryIOS({
  frames,
  gestures,
  redactions,
  setTime,
}: {
  frames: FrameData[];
  gestures: { [key: string]: ScreenGesture };
  redactions: { [key: string]: Redaction[]}
  setTime: (_: number) => void;
}) {
  const { setValue } = useFormContext<TraceFormData>();

  const setFrameData = (value: FrameData[]) => setValue("screens", value);
  const setGestureData = (value: { [key: string]: ScreenGesture }) => {
    setValue('gestures', value)
  };

  const handleDeleteFrame = (index: number) => {
    // remove frame from view
    const newFrameData = [...frames];
    newFrameData.splice(index, 1);
    setFrameData(newFrameData);
    // remove frame from gestures
    const updatedGestures = Object.fromEntries(
      Object.entries(gestures).filter(([key]) => key !== frames[index].id)
    );
    setGestureData(updatedGestures)
    // TODO: remove frame from redactions
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 items-start w-full h-full gap-6 p-6">
      {frames.map((frame, index) => (
        <div
          className="flex flex-col p-2 bg-neutral-100 dark:bg-neutral-900 rounded-xl"
          key={`${frame.timestamp}-${index}`}
        >
          {/* Toolbar */}
          <div className="flex flex-row w-full items-center justify-between mb-2">
            <div
              className="group flex p-1 justify-center items-center bg-neutral-800 rounded-lg"
              onClick={() => setTime(frame.timestamp)}
            >
              <span
                className="text-sm text-neutral-500 dark:text-neutral-400 tracking-tight leading-none slashed-zero tabular-nums group-hover:underline cursor-pointer"
                title={`Jump to timestamp: ${prettyNumber(frame.timestamp)}s`}
              >
                {`${prettyNumber(frame.timestamp)}s`}
              </span>
            </div>
            <button
              onClick={() => handleDeleteFrame(index)}
              className="inline-flex self-end items-center cursor-pointer"
              title="Delete snapshot"
            >
              <X className="size-6 text-neutral-500 dark:text-neutral-400 hover:opacity-75" />
            </button>
          </div>
          <div
            className="relative flex flex-col bg-neutral-100 dark:bg-neutral-900 rounded-xl"
            key={`${frame.id}`}
          >
            <Image
              className="z-0 object-cover w-full h-auto rounded-lg"
              src={frame.src}
              alt={`Extracted frame at ${frame.timestamp}`}
              draggable={false}
              width={0}
              height={0}
              sizes="100vw"
            />

            {/* Render redaction overlays using the natural dimensions and scale factors */}
            {(redactions[frame.id] ?? []).map((rect, idx) => (
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
      ))}
    </div>
  );
}
