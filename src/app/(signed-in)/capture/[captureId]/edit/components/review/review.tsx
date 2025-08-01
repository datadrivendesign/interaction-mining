"use client";

import { useRef, useState } from "react";
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
import { gestureOptions } from "@/lib/utils/gesture-options";
import { Progress } from "@/components/ui/progress";
import mergeRefs from "@/lib/utils/merge-refs";

export default function Review() {
  const { register } = useFormContext<TraceFormData>();
  const [descriptionLen, setDescriptionLen] = useState(0);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

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
            maxLength={75}
            onChange={(e) => {
              register("description").onChange?.(e);
              setDescriptionLen(e.target.value.length);
            }}
            ref={
              mergeRefs(
                register("description").ref,
                descriptionRef
              ) as React.MutableRefObject<HTMLTextAreaElement | null>
            }
            placeholder="In your own words, describe in one sentence the OVERALL task shown in these screens."
          />
          {descriptionRef.current && (
            <div className="w-full flex flex-col">
              <Progress
                className="w-full"
                value={
                  (descriptionLen / descriptionRef.current.maxLength) * 100
                }
              />
              <div className="text-sm flex justify-end text-muted-foreground z-10">
                {`${descriptionLen}/${descriptionRef.current.maxLength}`}
              </div>
            </div>
          )}
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
    <section className="block h-full w-full p-5">
      <div className="flex w-full overflow-x-scroll touch-pan-x">
        <div className="flex min-w-full gap-5">
          {screens.map((screen: FrameData, index: number) => (
            <figure
              className="relative flex flex-col bg-neutral-100 dark:bg-neutral-900 shrink-0 shadow-xs w-1/4"
              key={`${screen.id}`}
            >
              {/* Image container */}
              <div className="relative w-full">
                <TooltipProvider>
                  <Image
                    className="relative z-0 object-cover w-full h-full rounded-lg object-contain border-blue-500 border-2"
                    src={screen.src}
                    alt={`Extracted frame at ${screen.timestamp}`}
                    draggable={false}
                    width={0}
                    height={0}
                    sizes="100vw"
                  />

                  {gestures[screen.id]?.type && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="cursor-pointer aspect-square w-[12%] absolute z-10 rounded-full bg-yellow-300 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-70"
                          style={{
                            left: `${(gestures[screen.id]?.x ?? 0) * 100}%`,
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
                                (option) =>
                                  option.value === gestures[screen.id].type
                              )?.icon
                          }
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>
                          {gestures[screen.id]?.description ??
                            "No gesture description"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
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
                      <TooltipContent side="bottom">
                        {redaction.annotation}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
              {/* Gesture caption */}
              <div className="prose prose-neutral dark:prose-invert leading-snug font-sm font-semibold dark:text-neutral-900 overflow-auto h-full w-full whitespace-pre-wrap">
                <p className="text-sm text-center dark:text-neutral-300">
                  {gestures[screen.id]?.description ?? "Final task state"}
                </p>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
