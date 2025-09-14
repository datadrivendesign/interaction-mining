"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { gestureOptions } from "@/lib/utils/gesture-options";
import Image from "next/image";
import { FrameData, TraceFormData } from "../../../edit/components/types";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

export function ReviewGalleryAndroid({
  traceData,
}: {
  traceData: TraceFormData;
}) {
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
          {traceData.screens
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((screen, index) => (
              <figure
                key={screen.id}
                className="relative flex flex-col shrink-0 shadow-xs w-1/4"
              >
                {/* Image container */}
                <div className="relative w-full cursor-pointer">
                  {/* Index overlay - add this before the TooltipProvider */}
                  <div className="absolute top-1 right-1 z-20 bg-black/60 text-white text-sm font-mono rounded px-1 py-0.5 min-w-[1.5rem] text-center">
                    {index + 1}
                  </div>
                  <TooltipProvider delayDuration={100}>
                    {screen.src.length > 0 && (
                      <ImageWithVH
                        screen={screen}
                        vh={traceData.vhs?.[screen.id]}
                      />
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {traceData.gestures[screen.id] && (
                          <div
                            className="cursor-pointer aspect-square w-[12%] absolute z-20 rounded-full bg-yellow-300 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-85"
                            style={{
                              left: `${(traceData.gestures[screen.id].x ?? 0) * 100}%`,
                              top: `${(traceData.gestures[screen.id].y ?? 0) * 100}%`,
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
                                    option.value ===
                                    traceData.gestures[screen.id].type
                                )?.icon
                            }
                          </div>
                        )}
                      </TooltipTrigger>
                      {traceData.gestures[screen.id] && (
                        <TooltipContent
                          side="top"
                          sideOffset={5}
                          className="z-50"
                        >
                          <p>{traceData.gestures[screen.id].type}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    {(traceData.redactions[screen.id] || []).map(
                      (redaction, i) => (
                        <Tooltip key={`${redaction.id}`}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute z-15 bg-black border-1 border-yellow-500 cursor-pointer hover:shadow-yellow-500/50 hover:shadow-lg"
                              style={{
                                left: `${redaction.x * 100}%`,
                                top: `${redaction.y * 100}%`,
                                width: `${redaction.width * 100}%`,
                                height: `${redaction.height * 100}%`,
                              }}
                            ></div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={10}>
                            <p>{redaction.annotation}</p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    )}
                  </TooltipProvider>
                </div>
                {/* Gesture caption */}
                {traceData.gestures[screen.id] && (
                  <div className="prose prose-neutral dark:prose-invert leading-snug font-sm font-semibold dark:text-neutral-900 overflow-auto h-full w-full whitespace-pre-wrap">
                    <p className="text-sm text-center dark:text-neutral-300">
                      {traceData.gestures[screen.id].description ?? ""}
                    </p>
                  </div>
                )}
              </figure>
            ))}
        </div>
      </article>
    </section>
  );
}

const ImageWithVH = ({ screen, vh }: { screen: FrameData; vh: any }) => {
  // Extract bounding boxes from hierarchy data
  const { boxes, rootBounds } = useMemo(() => {
    if (!vh) return { boxes: [], rootBounds: null };

    const boxes: any[] = [];
    let rootBounds: any = null;

    function traverse(node: any) {
      if (node.bounds_in_screen) {
        const [left, top, right, bottom] = node.bounds_in_screen
          .split(" ")
          .map(Number);
        const width = right - left;
        const height = bottom - top;
        const x = left;
        const y = top;
        // If rootBounds is not set, this is the root node
        if (!rootBounds) {
          rootBounds = { x, y, width, height };
        }
        // do not collect boxes with no width or height
        if (width <= 0 || height <= 0) {
          return;
        }
        boxes.push({
          x,
          y,
          width,
          height,
          class: node.class_name,
          id: node.id || "null_id",
        });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => traverse(child));
      }
    }
    traverse(vh);
    return { boxes, rootBounds };
  }, [vh]);

  console.log(boxes, rootBounds);
  console.log(screen);
  return (
    <div className="w-full h-full">
      <Image
        className="relative z-0 w-full h-full rounded-lg object-contain border-blue-500 border-2"
        src={screen.src}
        alt={screen.id}
        width={0}
        height={0}
        sizes="100vw"
      />
      <svg
        viewBox={`${rootBounds.x} ${rootBounds.y} ${rootBounds.width} ${rootBounds.height}`}
        preserveAspectRatio="xMinYMin meet"
        className="pointer-events-none top-0 left-0 absolute w-full h-full"
      >
        {boxes.map((box: any, index: number) => (
          <rect
            key={box.id + index}
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill={"transparent"}
            stroke="red"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
};
