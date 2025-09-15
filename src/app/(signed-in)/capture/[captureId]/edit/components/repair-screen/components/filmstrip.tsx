import { cn, Platform, prettyNumber } from "@/lib/utils";
import { FrameData, Redaction, TraceFormData } from "../../types";
import { ScreenGesture } from "@prisma/client";
import { useNavigation } from "../repair-screen";
import { useFormContext } from "react-hook-form";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
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
    [setValue]
  );
  const setGestureData = useCallback(
    (value: { [key: string]: ScreenGesture }) => setValue("gestures", value),
    [setValue]
  );
  const setRedactionData = useCallback(
    (value: { [key: string]: Redaction[] }) => setValue("redactions", value),
    [setValue]
  );
  const setVHData = useCallback(
    (value: { [key: string]: any }) => setValue("vhs", value),
    [setValue]
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
    ]
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    scaleX: number;
    scaleY: number;
  }>({ width: 0, height: 0, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 });

  const updateSize = useCallback(() => {
    if (containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const imageRect = imageRef.current.getBoundingClientRect();
      const naturalWidth = imageRef.current.naturalWidth;
      const naturalHeight = imageRef.current.naturalHeight;

      // Only update if image is loaded (naturalWidth/Height > 0)
      if (naturalWidth > 0 && naturalHeight > 0) {
        // Calculate the scale factor between the natural and displayed size:
        const scaleX = imageRect.width / naturalWidth;
        const scaleY = imageRect.height / naturalHeight;
        // Compute offsets in case the image is letterboxed inside its container:
        const offsetX = (containerRect.width - imageRect.width) / 2;
        const offsetY = (containerRect.height - imageRect.height) / 2;
        setImgDimensions({
          width: imageRect.width,
          height: imageRect.height,
          offsetX,
          offsetY,
          scaleX,
          scaleY,
        });
      }
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    // Small delay to ensure image is fully rendered
    setTimeout(updateSize, 0);
  }, [updateSize]);

  useEffect(() => {
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [updateSize]);

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
        <div
          ref={containerRef}
          className="relative h-[calc(100%-1rem)] rounded-sm overflow-clip transition-all duration-200 ease-in-out select-none object-contain"
        >
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
                          : ""
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
                : "grayscale-0 brightness-100"
            )}
          >
            {/* {children} */}
            {screen.src ? (
              <Image
                ref={imageRef}
                key={screen.id}
                src={screen.src}
                alt="gallery"
                draggable={false}
                className="h-full w-auto object-contain"
                width={0}
                height={0}
                sizes="100vw"
                onLoad={handleImageLoad}
                onError={() => {
                  console.warn(`Failed to load image for screen ${screen.id}`);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full bg-muted/20">
                <div className="text-xs text-muted-foreground">Loading...</div>
              </div>
            )}
            {/* Render redaction overlays using the natural dimensions and scale factors */}
            {imgDimensions.width > 0 &&
              redactions.map((rect, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "absolute",
                    top:
                      imgDimensions.offsetY +
                      rect.y *
                        imageRef.current!.naturalHeight *
                        imgDimensions.scaleY,
                    left:
                      imgDimensions.offsetX +
                      rect.x *
                        imageRef.current!.naturalWidth *
                        imgDimensions.scaleX,
                    width:
                      rect.width *
                      imageRef.current!.naturalWidth *
                      imgDimensions.scaleX,
                    height:
                      rect.height *
                      imageRef.current!.naturalHeight *
                      imgDimensions.scaleY,
                    backgroundColor: "black",
                    border: "1px solid black",
                  }}
                />
              ))}
          </div>
        </div>
      </li>
    </motion.div>
  );
}
