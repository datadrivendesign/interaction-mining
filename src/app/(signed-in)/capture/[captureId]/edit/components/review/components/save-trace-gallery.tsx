"use client";

import Image from "next/image";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FrameData, Redaction, TraceFormData } from "../../types";
import type { ScreenGesture } from "@prisma/client";
import { useMeasure } from "@uidotdev/usehooks";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  findGestureOption,
  normalizeGestureType,
} from "@/lib/utils/gesture-options";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";

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
      <div className="flex w-full touch-pan-x overflow-x-scroll">
        <div className="flex min-w-full gap-5">
          {screens.map((screen: FrameData, index: number) => (
            <SaveTraceFigure
              key={screen.id}
              screen={screen}
              index={index}
              gesture={gestures[screen.id]}
              redactions={redactions[screen.id] || []}
              isLandscape={orientationByScreenId[screen.id] === "landscape"}
              onImageLoad={(img) => {
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
          ))}
        </div>
      </div>
    </section>
  );
}

function SaveTraceFigure({
  screen,
  index,
  gesture,
  redactions,
  isLandscape,
  onImageLoad,
}: {
  screen: FrameData;
  index: number;
  gesture?: ScreenGesture;
  redactions: Redaction[];
  isLandscape: boolean;
  onImageLoad: (img: HTMLImageElement) => void;
}) {
  const [containerRef, { width, height }] = useMeasure();
  const canvasWidth = width ?? 0;
  const canvasHeight = height ?? 0;

  const isDrag =
    gesture &&
    normalizeGestureType(gesture.type) === GESTURE_TYPES.DRAG &&
    gesture.x !== null &&
    gesture.y !== null &&
    gesture.scrollDeltaX !== null &&
    gesture.scrollDeltaY !== null &&
    canvasWidth > 0 &&
    canvasHeight > 0;

  const startX = isDrag ? gesture.x! * canvasWidth : 0;
  const startY = isDrag ? gesture.y! * canvasHeight : 0;
  const endX = isDrag ? (gesture.x! + gesture.scrollDeltaX!) * canvasWidth : 0;
  const endY = isDrag ? (gesture.y! + gesture.scrollDeltaY!) * canvasHeight : 0;
  const cardWidthClass = isLandscape
    ? "w-[min(38rem,88vw)]"
    : "w-[min(18rem,42vw)]";

  return (
    <figure
      className={`relative flex shrink-0 flex-col bg-neutral-100 shadow-xs dark:bg-neutral-900 ${cardWidthClass}`}
    >
      <div className="relative w-full" ref={containerRef}>
        <div className="absolute top-1 right-1 z-20 min-w-[1.5rem] rounded bg-black/60 px-1 py-0.5 text-center font-mono text-xs text-white">
          {index + 1}
        </div>

        <TooltipProvider delayDuration={100}>
          <Image
            className="relative z-10 h-full w-full rounded-lg border-2 border-blue-500 object-contain object-cover"
            src={screen.src}
            alt={`Extracted frame at ${screen.timestamp}`}
            draggable={false}
            width={0}
            height={0}
            sizes="100vw"
            onLoad={(event) => onImageLoad(event.currentTarget)}
          />

          {isDrag && (
            <svg
              className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
              width="100%"
              height="100%"
            >
              <defs>
                <marker
                  id={`dragArrowHead-${screen.id}`}
                  viewBox="0 0 8 8"
                  markerWidth="5"
                  markerHeight="5"
                  refX="7"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,8 L8,4 z" fill="rgba(23,23,23,0.72)" />
                </marker>
              </defs>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="rgba(23,23,23,0.72)"
                strokeWidth="2"
                markerEnd={`url(#dragArrowHead-${screen.id})`}
              />
              <circle
                cx={endX}
                cy={endY}
                r="4.75"
                fill="white"
                stroke="rgba(23,23,23,0.92)"
                strokeWidth="1.8"
              />
            </svg>
          )}

          {gesture?.type && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute z-20 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-yellow-300 opacity-70 md:h-7 md:w-7"
                  style={{
                    left: `${(gesture.x ?? 0) * 100}%`,
                    top: `${(gesture.y ?? 0) * 100}%`,
                  }}
                >
                  {findGestureOption(gesture.type)?.icon}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{gesture.type ?? "No gesture type"}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {redactions.map((redaction) => (
            <Tooltip key={redaction.id}>
              <TooltipTrigger asChild>
                <div
                  className="absolute z-15 cursor-pointer border-1 border-yellow-500 bg-black hover:shadow-lg hover:shadow-yellow-500/50"
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

      <div className="font-sm prose h-full w-full overflow-auto leading-snug font-semibold whitespace-pre-wrap prose-neutral dark:prose-invert dark:text-neutral-900">
        <p className="text-center text-sm dark:text-neutral-300">
          {gesture?.description ?? ""}
        </p>
      </div>
    </figure>
  );
}
