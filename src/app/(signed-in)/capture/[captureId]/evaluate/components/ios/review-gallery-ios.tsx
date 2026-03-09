"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  findGestureOption,
  normalizeGestureType,
} from "@/lib/utils/gesture-options";
import Image from "next/image";
import { TraceFormData } from "../../../edit/components/types";
import { Badge } from "@/components/ui/badge";
import { useMeasure } from "@uidotdev/usehooks";
import type { ScreenGesture } from "@prisma/client";
import { useState } from "react";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";

export function ReviewGalleryIOS({
  traceData,
  videoRef,
}: {
  traceData: TraceFormData;
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  const [orientationByScreenId, setOrientationByScreenId] = useState<
    Record<string, "portrait" | "landscape">
  >({});

  return (
    <section className="block w-full h-full p-5">
      <Badge variant="default" className="bg-black my-5">
        <article className="prose prose-neutral dark:prose-invert leading-snug font-sm text-white dark:text-neutral-900 overflow-auto w-full whitespace-pre-wrap">
          <p className="text-center">
            Description: {traceData.description ?? "No description provided."}
          </p>
        </article>
      </Badge>
      <article className="flex w-full overflow-x-scroll touch-pan-x">
        <div className="flex min-w-full gap-5">
          {[...traceData.screens]
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((screen, index) => (
              <ReviewFigureIOS
                key={screen.id}
                index={index}
                screen={screen}
                gesture={traceData.gestures[screen.id]}
                redactions={traceData.redactions[screen.id] || []}
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
                onJump={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = screen.timestamp;
                  }
                }}
              />
            ))}
        </div>
      </article>
    </section>
  );
}

function ReviewFigureIOS({
  index,
  screen,
  gesture,
  redactions,
  isLandscape,
  onImageLoad,
  onJump,
}: {
  index: number;
  screen: TraceFormData["screens"][number];
  gesture?: ScreenGesture;
  redactions: TraceFormData["redactions"][string];
  isLandscape: boolean;
  onImageLoad: (img: HTMLImageElement) => void;
  onJump: () => void;
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
      className={`relative flex flex-col shrink-0 shadow-xs ${cardWidthClass}`}
    >
      <div
        className="relative w-full cursor-pointer"
        onClick={onJump}
        ref={containerRef}
      >
        <div className="absolute top-1 right-1 z-20 bg-black/60 text-white text-sm font-mono rounded px-1 py-0.5 min-w-[1.5rem] text-center">
          {index + 1}
        </div>

        <TooltipProvider delayDuration={100}>
          {screen.src.length > 0 && (
            <Image
              src={screen.src}
              alt={screen.id}
              width={0}
              height={0}
              sizes="100vw"
              className="relative z-0 w-full h-full rounded-lg object-contain border-blue-500 border-2"
              onLoad={(event) => onImageLoad(event.currentTarget)}
            />
          )}

          {isDrag && (
            <svg
              className="absolute inset-0 z-10 w-full h-full pointer-events-none overflow-visible"
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
                r="5"
                fill="white"
                stroke="rgba(23,23,23,0.92)"
                strokeWidth="1.8"
              />
            </svg>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              {gesture ? (
                <div
                  className="cursor-pointer absolute z-20 rounded-full bg-yellow-300 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-85 w-7 h-7 md:w-8 md:h-8"
                  style={{
                    left: `${(gesture.x ?? 0) * 100}%`,
                    top: `${(gesture.y ?? 0) * 100}%`,
                  }}
                >
                  {findGestureOption(gesture.type)?.icon}
                </div>
              ) : (
                <span />
              )}
            </TooltipTrigger>
            {gesture && (
              <TooltipContent side="top" sideOffset={5} className="z-50">
                <p>{gesture.type}</p>
              </TooltipContent>
            )}
          </Tooltip>

          {redactions.map((redaction) => (
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
              <TooltipContent side="top" sideOffset={10}>
                <p>{redaction.annotation}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {gesture && (
        <div className="prose prose-neutral dark:prose-invert leading-snug font-sm font-semibold dark:text-neutral-900 overflow-auto h-full w-full whitespace-pre-wrap">
          <p className="text-sm text-center dark:text-neutral-300">
            {gesture.description ?? ""}
          </p>
        </div>
      )}
    </figure>
  );
}
