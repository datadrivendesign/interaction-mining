"use client";

import React, { useContext } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { FrameData, Redaction, TraceFormData } from "../types";
import { ScreenGesture } from "@prisma/client";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { gestureOptions } from "../repair-screen";

export default function Review() {
  const { register } = useFormContext<TraceFormData>();

  return (
    <div className="flex w-full h-full">
      <div className="flex w-2/3 h-full overflow-auto border-r border-neutral-200 dark:border-neutral-800">
        <SaveTraceGallery />
      </div>
      <div className="sticky top-0 flex flex-col shrink-0 grow-0 justify-center items-center w-1/3 h-full p-8">
        <div className="flex flex-col w-full grow justify-start">
          <Label htmlFor="description" className="mb-2">
            Trace Description
          </Label>
          <Textarea
            {...register("description")}
            id="description"
            placeholder="Describe the screen activity using your own words in 1-2 sentences."
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
  const redactions = watch("redactions") as { [key: string]: Redaction[] };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-start w-full gap-4 overflow-auto p-8">
      {screens.map((screen: FrameData) => (
        <div
          className="relative flex flex-col bg-neutral-100 dark:bg-neutral-900 rounded-xl"
          key={`${screen.id}`}
        >
          <TooltipProvider>
            <Image
              className="z-0 object-cover w-full h-auto rounded-lg"
              src={screen.src}
              alt={`Extracted frame at ${screen.timestamp}`}
              draggable={false}
              width={0}
              height={0}
              sizes="100vw"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="cursor-pointer aspect-square w-[12%] absolute z-10 rounded-full bg-yellow-300 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{
                    left: `${(gestures[screen.id].x ?? 0) * 100}%`,
                    top: `${(gestures[screen.id]?.y ?? 0) * 100}%`,
                  }}
                >
                  {
                    gestureOptions
                      .flatMap((option) => [
                        option,
                        ...(option.subGestures ?? []),
                      ])
                      .find(
                        (option) => option.value === gestures[screen.id].type
                      )?.icon
                  }
                </div >
              </TooltipTrigger >
              <TooltipContent side="bottom">
                <p>{gestures[screen.id].description}</p>
              </TooltipContent>
            </Tooltip >

            {(redactions[screen.id] || []).map((redaction) => (
              <Tooltip key={redaction.id}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute z-0 bg-black"
                    style={{
                      left: `${redaction.x * 100}%`,
                      top: `${redaction.y * 100}%`,
                      width: `${redaction.width * 100}%`,
                      height: `${redaction.height * 100}%`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">{redaction.annotation}</TooltipContent>
              </Tooltip>
            ))
            }
          </TooltipProvider >
        </div >
      ))}
    </div >
  );
}
