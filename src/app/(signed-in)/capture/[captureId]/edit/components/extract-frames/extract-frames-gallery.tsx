"use client";

import Image from "next/image";
import React from "react";
import { X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { ScreenGesture } from "@prisma/client";
import { AnimatePresence, motion, Variants } from "motion/react";
import { prettyNumber } from "@/lib/utils/number";
import { TraceFormData, FrameData } from "../types";

const spring = {
  type: "spring",
  bounce: 0.125,
  duration: 0.825,
};

export const card = {
  initial: {
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
} as Variants;

export function FrameGalleryAndroid({
  frames,
  vhs,
  gestures,
}: {
  frames: FrameData[];
  vhs: { [key: string]: any };
  gestures: { [key: string]: ScreenGesture };
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
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 items-start w-full h-full gap-6 p-6 overflow-auto">
      <AnimatePresence mode="popLayout">
        {frames.map((frame, index) => (
          <motion.div
            className="flex flex-col p-2 bg-neutral-100 dark:bg-neutral-900 rounded-xl"
            variants={card}
            initial="initial"
            animate="animate"
            exit="exit"
            layout="position"
            transition={spring}
            key={`${frame.timestamp}-${frame.id}`}
          >
            {/* Toolbar */}
            <div className="flex flex-row w-full items-center justify-between mb-2">
              <div className="group flex p-1 justify-center items-center bg-neutral-800 rounded-lg">
                <span className="text-sm text-muted-foreground tracking-tight leading-none slashed-zero tabular-nums group-hover:underline cursor-pointer">
                  {`${new Date(frame.timestamp).toISOString()}`}
                </span>
              </div>
              <button
                onClick={() => handleDeleteFrame(index)}
                className="inline-flex self-end items-center cursor-pointer"
                title="Delete snapshot"
              >
                <X className="size-6 text-muted-foreground hover:opacity-75" />
              </button>
            </div>
            <Image
              className="z-0 object-cover w-full h-auto rounded-lg"
              src={frame.src}
              alt={`Extracted frame at ${frame.timestamp}`}
              draggable={false}
              width={0}
              height={0}
              sizes="100vw"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function FrameGalleryIOS({
  frames,
  gestures,
  setTime,
}: {
  frames: FrameData[];
  gestures: { [key: string]: ScreenGesture };
  setTime: (_: number) => void;
}) {
  const { setValue } = useFormContext<TraceFormData>();

  const setFrameData = (value: FrameData[]) => setValue("screens", value);
  const setGestureData = (value: { [key: string]: ScreenGesture }) => {
    setValue("gestures", value);
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
    setGestureData(updatedGestures);
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 items-start w-full h-full gap-6 p-6">
      <AnimatePresence mode="popLayout">
        {frames.map((frame, index) => (
          <motion.div
            className="flex flex-col p-2 bg-neutral-100 dark:bg-neutral-900 rounded-xl cursor-pointer"
            variants={card}
            initial="initial"
            animate="animate"
            exit="exit"
            layout="position"
            transition={spring}
            key={`${frame.timestamp}-${frame.id}`}
            onClick={() => setTime(frame.timestamp)}
          >
            {/* Toolbar */}
            <div className="flex flex-row w-full items-center justify-between mb-2">
              <div className="flex p-1 justify-center items-center bg-neutral-800 rounded-lg">
                <span
                  className="text-sm text-muted-foreground tracking-tight leading-none slashed-zero tabular-nums"
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
                <X className="size-6 text-muted-foreground hover:opacity-75" />
              </button>
            </div>
            <Image
              className="z-0 object-cover w-full h-auto rounded-lg"
              src={frame.src}
              alt={`Extracted frame at ${frame.timestamp}`}
              draggable={false}
              width={0}
              height={0}
              sizes="100vw"
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
