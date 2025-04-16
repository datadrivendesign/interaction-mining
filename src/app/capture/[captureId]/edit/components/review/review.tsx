"use client";

import React, { useContext } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { TraceFormData } from "../../page";
import { ScreenGesture } from "@prisma/client";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { GestureOptionsContext } from "../../util";

export default function Review() {
  const { register } = useFormContext<TraceFormData>();

  return (
    <div className="flex flex-row w-full h-[calc(100dvh-var(--nav-height))]">
      <div className="flex w-2/3 h-full overflow-auto border-r border-neutral-200 dark:border-neutral-800">
        <SaveTraceGallery />
      </div>
      <div className="flex flex-col shrink-0 grow-0 justify-center items-center w-1/3 h-full p-8">
        <div className="flex flex-col w-full grow justify-start">
          <Label htmlFor="description" className="mb-2">
            Trace Description
          </Label>
          <Textarea
            {...register("description")}
            id="description"
            placeholder="Describe how you completed your task"
          />
        </div>
      </div>
    </div>
  );
}

export const gestureOptions: GestureOption[] = [
  {
    value: "Tap",
    label: "Tap",
    icon: <Circle className="size-4 text-yellow-800 hover:text-black" />
  },
  {
    value: "Double tap",
    label: "Double tap",
    icon: <CircleDot className="size-4 text-yellow-800 hover:text-black" />
  },
  {
    value: "Touch and hold",
    label: "Touch and hold",
    icon: <CircleStop className="size-4 text-yellow-800 hover:text-black" />
  },
  {
    value: "Swipe",
    label: "Swipe",
    subGestures: [{
      value: "Swipe up",
      label: "Swipe up",
      icon: <ArrowUpFromLine className="size-4 text-yellow-800 hover:text-black" />
    }, {
      value: "Swipe down",
      label: "Swipe down",
      icon: <ArrowDownFromLine className="size-4 text-yellow-800 hover:text-black" />
    }, {
      value: "Swipe left",
      label: "Swipe left",
      icon: <ArrowLeftFromLine className="size-4 text-yellow-800 hover:text-black" />
    }, {
      value: "Swipe right",
      label: "Swipe right",
      icon: <ArrowRightFromLine className="size-4 text-yellow-800 hover:text-black" />
    }]
  },
  {
    value: "Drag",
    label: "Drag",
    icon: <Grab className="size-4 text-yellow-800 hover:text-black" />
  },
  {
    value: "Zoom",
    label: "Zoom",
    subGestures: [{
      value: "Zoom in",
      label: "Zoom in",
      icon: <Shrink className="size-4 text-yellow-800 hover:text-black" />
    }, {
      value: "Zoom out",
      label: "Zoom out",
      icon: <Expand className="size-4 text-yellow-800 hover:text-black" />
    }]
  },
  {
    value: "Rotate",
    label: "Rotate",
    subGestures: [{
      value: "Rotate cw",
      label: "Rotate cw",
      icon: <IterationCw className="size-4 text-yellow-800 hover:text-black" />
    }, {
      value: "Rotate ccw",
      label: "Rotate ccw",
      icon: <IterationCcw className="size-4 text-yellow-800 hover:text-black" />
    }]
  }
];

function SaveTraceGallery() {
  const { watch } = useFormContext<TraceFormData>();
  const screens = watch("screens");
  const gestures = watch("gestures") as { [key: string]: ScreenGesture };
  const { gestureOptions } = useContext(GestureOptionsContext);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 items-start w-full gap-4 overflow-auto p-8">
      {screens.map((screen) => (
        <div
          className="relative flex flex-col bg-neutral-100 dark:bg-neutral-900 rounded-xl"
          key={`${screen.id}`}
        >
          <Image
            className="z-0 object-cover w-full h-auto rounded-lg"
            src={screen.url}
            alt={`Extracted frame at ${screen.timestamp}`}
            draggable={false}
            width={0}
            height={0}
            sizes="100vw" >
          </Image>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer aspect-square w-[12%] absolute rounded-full opacity-70 bg-green-300 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{
                    left: `${(gestures[screen.id].x ?? 0) * 100}%`,
                    top: `${(gestures[screen.id]?.y ?? 0) * 100}%`,
                  }}
                >
                  {gestureOptions
                    .flatMap((option) => [option, ...(option.subGestures ?? [])])
                    .find((option) => option.value === gestures[screen.id].type)?.icon}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>
                  {gestures[screen.id].description}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ))}
    </div>
  );
}
