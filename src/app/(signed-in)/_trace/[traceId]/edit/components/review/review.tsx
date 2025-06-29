"use client";

import React, { useContext } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { TraceFormData } from "../types";
import { Screen, ScreenGesture } from "@prisma/client";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { gestureOptions } from "../repair-screen";

export default function Review() {
  const { register } = useFormContext<TraceFormData>();

  return (
    <div className="flex w-full h-full">
      <div className="flex w-2/3 border-r border-neutral-200 dark:border-neutral-800 overflow-auto">
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

function SaveTraceGallery() {
  const { watch } = useFormContext<TraceFormData>();
  const screens = watch("screens");
  const gestures = watch("gestures") as { [key: string]: ScreenGesture };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-start w-full gap-4 p-8">
      {screens.map((screen: Screen) => (
        <div
          className="relative flex flex-col bg-neutral-100 dark:bg-neutral-900 rounded-xl"
          key={`${screen.id}`}
        >
          <Image
            className="z-0 object-cover w-full h-auto rounded-lg"
            src={screen.src}
            alt={`Extracted frame at ${screen.id}`}
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
