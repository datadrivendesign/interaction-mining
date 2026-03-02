"use client";

import Image from "next/image";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FrameData, Redaction, TraceFormData } from "../../types";
import { ScreenGesture } from "@prisma/client";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { gestureOptions } from "@/lib/utils/gesture-options";

export function SaveTraceGallery() {
  const { watch } = useFormContext<TraceFormData>();
  const screens = watch("screens");
  const gestures = watch("gestures") as { [key: string]: ScreenGesture };
  const redactions = watch("redactions") as { [key: string]: Redaction[] };
  const [orientationByScreenId, setOrientationByScreenId] = useState<
    Record<string, "portrait" | "landscape">
  >({});

  return (
    <section className="block h-full w-full p-5">
      <div className="flex w-full overflow-x-scroll touch-pan-x">
        <div className="flex min-w-full gap-5">
          {screens.map((screen: FrameData, index: number) => {
            const isLandscape =
              orientationByScreenId[screen.id] === "landscape";
            const cardWidthClass = isLandscape
              ? "w-[min(38rem,88vw)]"
              : "w-[min(18rem,42vw)]";

            return (
              <figure
                className={`relative flex flex-col bg-neutral-100 dark:bg-neutral-900 shrink-0 shadow-xs ${cardWidthClass}`}
                key={`${screen.id}`}
              >
                {/* Image container */}
                <div className="relative w-full">
                  {/* Index overlay */}
                  <div className="absolute top-1 right-1 z-20 bg-black/60 text-white text-xs font-mono rounded px-1 py-0.5 min-w-[1.5rem] text-center">
                    {index + 1}
                  </div>
                  <TooltipProvider delayDuration={100}>
                    <Image
                      className="relative z-10 object-cover w-full h-full rounded-lg object-contain border-blue-500 border-2"
                      src={screen.src}
                      alt={`Extracted frame at ${screen.timestamp}`}
                      draggable={false}
                      width={0}
                      height={0}
                      sizes="100vw"
                      onLoad={(event) => {
                        const img = event.currentTarget;
                        if (!img.naturalWidth || !img.naturalHeight) {
                          return;
                        }
                        setOrientationByScreenId((prev) => ({
                          ...prev,
                          [screen.id]:
                            img.naturalWidth > img.naturalHeight
                              ? "landscape"
                              : "portrait",
                        }));
                      }}
                    />

                    {gestures[screen.id]?.type && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="cursor-pointer absolute z-20 rounded-full bg-yellow-300 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-70 w-8 h-8 md:w-9 md:h-9"
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
                                    option.value === gestures[screen.id].type,
                                )?.icon
                            }
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>
                            {gestures[screen.id]?.type ?? "No gesture type"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {(redactions[screen.id] || []).map((redaction) => (
                      <Tooltip key={redaction.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute z-15 bg-black border-1 border-yellow-500 cursor-pointer hover:shadow-yellow-500/50 hover:shadow-lg"
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
                    {gestures[screen.id]?.description ?? ""}
                  </p>
                </div>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
