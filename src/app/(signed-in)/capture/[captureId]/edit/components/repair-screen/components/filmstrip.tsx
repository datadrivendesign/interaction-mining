import { cn, Platform, prettyNumber } from "@/lib/utils";
import { FrameData, Redaction } from "../../types";
import type { ScreenGesture } from "@prisma/client";
import { useNavigation } from "../repair-screen";
import { AnimatePresence, motion } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleAlert, X } from "lucide-react";
import Kbd from "@/components/ui/kbd";
import Image from "next/image";
import { card } from "../util";
import { spring } from "@/lib/motion";
import { findGestureOption } from "@/lib/utils/gesture-options";
import { isScreenAnnotationComplete } from "../util";
import { useEffect, useRef } from "react";

export function Filmstrip({
  screens,
  gestures,
  redactions,
  os,
}: {
  screens: FrameData[];
  gestures: { [key: string]: ScreenGesture };
  redactions: { [screenId: string]: Redaction[] };
  os: Platform;
}) {
  const { focusedScreenId, selectScreen, handleDeleteScreen } = useNavigation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusedScreenId === null) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      // Queried by id, not position: an insert shifts every later index, so a
      // positional selector can scroll to the wrong thumbnail.
      const selectedItem = container.querySelector<HTMLElement>(
        `[data-screen-id="${focusedScreenId}"]`,
      );
      if (!selectedItem) {
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const selectedRect = selectedItem.getBoundingClientRect();
      const isOutOfView =
        selectedRect.left < containerRect.left ||
        selectedRect.right > containerRect.right;

      if (isOutOfView) {
        selectedItem.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [focusedScreenId, screens.length]);

  return (
    <div ref={containerRef} className="h-full overflow-x-auto">
      <ul className="relative z-0 flex h-full gap-1 p-2">
        <AnimatePresence mode="popLayout">
          {screens?.map((screen: FrameData, index: number) => {
            const isLast = screens.length - 1 === index;
            return (
              <FilmstripItem
                key={screen.id}
                index={index}
                screen={screen}
                gesture={gestures[screen.id]}
                redactions={redactions[screen.id] ?? []}
                os={os}
                isSelected={focusedScreenId === screen.id}
                hasError={
                  isLast
                    ? false
                    : !isScreenAnnotationComplete(gestures[screen.id])
                }
                onClick={() => selectScreen(screen.id, "filmstrip")}
                handleDeleteFrame={handleDeleteScreen}
              />
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function FilmstripItem({
  screen,
  gesture,
  redactions,
  index = 0,
  os,
  isSelected,
  hasError = false,
  handleDeleteFrame,
  onClick,
}: {
  screen: FrameData;
  gesture?: ScreenGesture;
  redactions: Array<Redaction>;
  index?: number;
  os: Platform;
  isSelected?: boolean;
  hasError?: boolean;
  handleDeleteFrame: (screenId: string) => void;
  onClick?: () => void;
}) {
  const hasGestureCoordinates =
    gesture?.x !== null &&
    gesture?.x !== undefined &&
    gesture?.y !== null &&
    gesture?.y !== undefined;

  return (
    <motion.li
      className="h-full max-w-full min-w-fit cursor-pointer"
      data-screen-id={screen.id}
      variants={card}
      initial="initial"
      animate="animate"
      exit="exit"
      layout="position"
      transition={spring()}
      key={`${screen.timestamp}-${screen.id}`}
      onClick={onClick}
    >
      {/* Toolbar */}
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex items-center justify-center rounded-lg bg-background">
          <span
            className="text-xs leading-none tracking-tight text-muted-foreground slashed-zero tabular-nums"
            title={`Jump to time: ${prettyNumber(screen.timestamp, os)}s`}
          >
            {`${prettyNumber(screen.timestamp, os)}s`}
          </span>
        </div>
        <button
          onClick={(e) => {
            // Prevent bubbling to parent click handlers that set focus/time
            e.stopPropagation();
            handleDeleteFrame(screen.id);
          }}
          className="inline-flex cursor-pointer items-center self-end"
          title="Delete snapshot"
        >
          <X className="size-4 text-muted-foreground hover:opacity-75" />
        </button>
      </div>
      <div className="relative h-[calc(100%-1rem)] overflow-clip rounded-sm object-contain transition-all duration-200 ease-in-out select-none">
        {/* Index overlay */}
        <div className="absolute top-1 right-1 z-20 min-w-[1.5rem] rounded bg-black/60 px-1 py-0.5 text-center font-mono text-xs text-white">
          {index + 1}
        </div>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {(isSelected || hasError) && (
                <div
                  className={cn(
                    "absolute z-10 flex h-full w-full items-center justify-center rounded-sm",
                    isSelected
                      ? "ring-3 ring-blue-500 ring-inset"
                      : hasError
                        ? "ring-3 ring-yellow-500 ring-inset"
                        : "",
                  )}
                >
                  {hasError && (
                    <CircleAlert className={cn("size-6", "text-yellow-500")} />
                  )}
                </div>
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-sm">Add a gesture.</div>
              <div className="flex w-full items-center justify-between gap-2 text-sm">
                <span>
                  <Kbd className="rounded-sm text-muted-foreground">Tab</Kbd>
                </span>
                to next screen.
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div
          className={cn(
            "relative h-full min-w-fit transition-all duration-200 ease-in-out select-none",
            hasError
              ? isSelected
                ? "brightness-70 grayscale"
                : "brightness-50 grayscale"
              : "brightness-100 grayscale-0",
          )}
        >
          {/* {children} */}
          {screen.src ? (
            <Image
              key={screen.id}
              src={screen.src}
              alt="gallery"
              draggable={false}
              className="h-full w-auto object-contain"
              width={0}
              height={0}
              sizes="100vw"
              onError={() => {
                console.warn(`Failed to load image for screen ${screen.id}`);
              }}
            />
          ) : (
            <div className="bg-muted/20 flex h-full w-full items-center justify-center">
              <div className="text-xs text-muted-foreground">Loading...</div>
            </div>
          )}
          {/* Render redaction overlays in image-normalized coordinates. */}
          {redactions.map((rect, idx) => (
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
          {gesture?.type && (
            <div
              className={cn(
                "pointer-events-none absolute z-20",
                hasGestureCoordinates
                  ? "top-0 left-0 -translate-x-1/2 -translate-y-1/2"
                  : "inset-0 flex items-center justify-center",
              )}
              style={
                hasGestureCoordinates
                  ? {
                      left: `${(gesture.x ?? 0) * 100}%`,
                      top: `${(gesture.y ?? 0) * 100}%`,
                    }
                  : undefined
              }
            >
              <div className="flex size-6 items-center justify-center rounded-full border border-black/20 bg-yellow-300/85 shadow-xs">
                {findGestureOption(gesture.type)?.icon}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.li>
  );
}
