import { cn, Platform, prettyNumber } from "@/lib/utils";
import { FrameData, Redaction, TraceFormData } from "../../types";
import type { ScreenGesture } from "@prisma/client";
import { useNavigation } from "../repair-screen";
import { useFormContext } from "react-hook-form";
import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";
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

export function Filmstrip({
  screens,
  gestures,
  redactions,
  vhs,
  os,
  handleSetTime,
}: {
  screens: FrameData[];
  gestures: { [key: string]: ScreenGesture };
  redactions: { [screenId: string]: Redaction[] };
  vhs?: { [key: string]: any };
  os: Platform;
  handleSetTime: (t: number) => void;
}) {
  const { focusViewIndex, setFocusViewIndex } = useNavigation();
  const { setValue } = useFormContext<TraceFormData>();

  const setFrameData = useCallback(
    (value: FrameData[]) => setValue("screens", value),
    [setValue],
  );
  const setGestureData = useCallback(
    (value: { [key: string]: ScreenGesture }) => setValue("gestures", value),
    [setValue],
  );
  const setRedactionData = useCallback(
    (value: { [key: string]: Redaction[] }) => setValue("redactions", value),
    [setValue],
  );
  const setVHData = useCallback(
    (value: { [key: string]: any }) => setValue("vhs", value),
    [setValue],
  );

  const handleDeleteFrame = useCallback(
    (index: number) => {
      // Reset focus view to -1 upon deletion
      setFocusViewIndex(-1);
      // remove frame from view
      const newFrameData = [...screens];
      newFrameData.splice(index, 1);
      // remove frame from gestures and redactions
      const updatedGestures: { [key: string]: ScreenGesture } = {};
      const updatedRedactions: { [key: string]: Redaction[] } = {};
      const updatedVHS: { [key: string]: any } = {};
      for (const frame of newFrameData) {
        if (gestures[frame.id]) {
          updatedGestures[frame.id] = gestures[frame.id];
        }
        if (redactions[frame.id]) {
          updatedRedactions[frame.id] = redactions[frame.id];
        }
        if (vhs && vhs[frame.id]) {
          updatedVHS[frame.id] = vhs[frame.id];
        }
      }
      // update frame data, gestures, and redactions
      setFrameData(newFrameData);
      setGestureData(updatedGestures);
      setRedactionData(updatedRedactions);
      if (vhs) {
        setVHData(updatedVHS);
      }
    },
    [
      screens,
      gestures,
      redactions,
      vhs,
      setFrameData,
      setGestureData,
      setRedactionData,
      setFocusViewIndex,
      setVHData,
    ],
  );

  return (
    <AnimatePresence mode="popLayout">
      <ul className="flex h-full p-2 gap-1 overflow-x-auto">
        {screens?.map((screen: FrameData, index: number) => {
          const isLast = screens.length - 1 === index;
          return (
            <FilmstripItem
              key={screen.id}
              index={index}
              isLast={isLast}
              screen={screen}
              gesture={gestures[screen.id]}
              redactions={redactions[screen.id] ?? []}
              os={os}
              isSelected={focusViewIndex === index}
              hasError={
                !gestures[screen.id] ||
                gestures[screen.id].type === null ||
                gestures[screen.id].description === undefined ||
                gestures[screen.id].description === ""
              }
              onClick={() => setFocusViewIndex(index)}
              handleSetTime={handleSetTime}
              handleDeleteFrame={handleDeleteFrame}
            ></FilmstripItem>
          );
        })}
      </ul>
    </AnimatePresence>
  );
}

function FilmstripItem({
  screen,
  gesture,
  redactions,
  index = 0,
  isLast = false,
  os,
  isSelected,
  hasError = false,
  handleSetTime,
  handleDeleteFrame,
  // children,
  ...props
}: {
  screen: FrameData;
  gesture?: ScreenGesture;
  redactions: Array<Redaction>;
  index?: number;
  isLast: boolean;
  os: Platform;
  isSelected?: boolean;
  hasError?: boolean;
  handleSetTime: (t: number) => void;
  handleDeleteFrame: (index: number) => void;
  // children?: React.ReactNode;
} & React.HTMLAttributes<HTMLLIElement>) {
  return (
    <motion.div
      className="min-w-fit h-full max-w-full"
      variants={card}
      initial="initial"
      animate="animate"
      exit="exit"
      layout="position"
      transition={spring}
      key={`${screen.timestamp}-${screen.id}`}
      onClick={() => handleSetTime(screen.timestamp)}
    >
      <li
        className="cursor-pointer min-w-fit h-full"
        data-index={index}
        {...props}
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
                        ? "ring-2 ring-inset ring-blue-500"
                        : hasError && !isLast
                          ? "ring-2 ring-inset ring-yellow-500"
                          : "",
                    )}
                  >
                    {hasError && !isLast && (
                      <CircleAlert
                        className={cn("size-6", "text-yellow-500")}
                      />
                    )}
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent>
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
              hasError && !isLast
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
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border border-black/20 flex items-center justify-center">
                  {findGestureOption(gesture.type)?.icon}
                </div>
              </div>
            )}
          </div>
        </div>
      </li>
    </motion.div>
  );
}
