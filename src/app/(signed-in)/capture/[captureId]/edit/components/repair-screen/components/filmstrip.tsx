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
import { validateGestureDescription } from "../util";
import { useEffect, useRef } from "react";

export function Filmstrip({
  screens,
  gestures,
  redactions,
  os,
  handleSetTime,
}: {
  screens: FrameData[];
  gestures: { [key: string]: ScreenGesture };
  redactions: { [screenId: string]: Redaction[] };
  os: Platform;
  handleSetTime: (t: number) => void;
}) {
  const { focusViewIndex, setFocusViewIndex, handleDeleteScreen } =
    useNavigation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusViewIndex < 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const selectedItem = container.querySelector<HTMLElement>(
        `[data-index="${focusViewIndex}"]`,
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
  }, [focusViewIndex, screens.length]);

  return (
    <div ref={containerRef} className="h-full overflow-x-auto">
      <ul className="relative z-0 flex h-full p-2 gap-1">
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
                isSelected={focusViewIndex === index}
                hasError={
                  isLast
                    ? false
                    : !gestures[screen.id] ||
                      gestures[screen.id].type === null ||
                      !validateGestureDescription(gestures[screen.id])
                }
                onClick={() => setFocusViewIndex(index)}
                handleSetTime={handleSetTime}
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
  handleSetTime,
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
  handleSetTime: (t: number) => void;
  handleDeleteFrame: (index: number) => void;
  onClick?: () => void;
}) {
  const hasGestureCoordinates =
    gesture?.x !== null &&
    gesture?.x !== undefined &&
    gesture?.y !== null &&
    gesture?.y !== undefined;

  return (
    <motion.li
      className="cursor-pointer min-w-fit h-full max-w-full"
      data-index={index}
      variants={card}
      initial="initial"
      animate="animate"
      exit="exit"
      layout="position"
      transition={spring}
      key={`${screen.timestamp}-${screen.id}`}
      onClick={() => {
        onClick?.();
        handleSetTime(screen.timestamp);
      }}
    >
        {/* Toolbar */}
        <div className="flex flex-row w-full items-center justify-between">
          <div className="flex justify-center items-center bg-background rounded-lg">
            <span
              className="text-xs text-muted-foreground tracking-tight leading-none slashed-zero tabular-nums"
              title={`Jump to time: ${prettyNumber(screen.timestamp, os)}s`}
            >
              {`${prettyNumber(screen.timestamp, os)}s`}
            </span>
          </div>
          <button
            onClick={(e) => {
              // Prevent bubbling to parent click handlers that set focus/time
              e.stopPropagation();
              handleDeleteFrame(index);
            }}
            className="inline-flex self-end items-center cursor-pointer"
            title="Delete snapshot"
          >
            <X className="size-4 text-muted-foreground hover:opacity-75" />
          </button>
        </div>
        <div className="relative h-[calc(100%-1rem)] rounded-sm overflow-clip transition-all duration-200 ease-in-out select-none object-contain">
          {/* Index overlay */}
          <div className="absolute top-1 right-1 z-20 bg-black/60 text-white text-xs font-mono rounded px-1 py-0.5 min-w-[1.5rem] text-center">
            {index + 1}
          </div>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                {(isSelected || hasError) && (
                  <div
                    className={cn(
                      "absolute z-10 flex w-full h-full justify-center items-center rounded-sm",
                      isSelected
                        ? "ring-3 ring-inset ring-blue-500"
                        : hasError
                          ? "ring-3 ring-inset ring-yellow-500"
                          : "",
                    )}
                  >
                    {hasError && (
                      <CircleAlert
                        className={cn("size-6", "text-yellow-500")}
                      />
                    )}
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-sm">Add a gesture.</div>
                <div className="flex w-full justify-between items-center gap-2 text-sm">
                  <span>
                    <Kbd className="text-muted-foreground rounded-sm">Tab</Kbd>
                  </span>
                  to next screen.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div
            className={cn(
              "relative min-w-fit h-full transition-all duration-200 ease-in-out select-none",
              hasError
                ? isSelected
                  ? "grayscale brightness-70"
                  : "grayscale brightness-50"
                : "grayscale-0 brightness-100",
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
              <div className="flex items-center justify-center h-full w-full bg-muted/20">
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
                  "absolute pointer-events-none z-20",
                  hasGestureCoordinates
                    ? "left-0 top-0 -translate-x-1/2 -translate-y-1/2"
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
                <div className="size-6 rounded-full border border-black/20 bg-yellow-300/85 shadow-xs flex items-center justify-center">
                  {findGestureOption(gesture.type)?.icon}
                </div>
              </div>
            )}
          </div>
        </div>
    </motion.li>
  );
}
