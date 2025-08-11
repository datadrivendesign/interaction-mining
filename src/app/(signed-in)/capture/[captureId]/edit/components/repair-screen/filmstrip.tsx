import { cn, Platform, prettyNumber } from "@/lib/utils";
import { FrameData, Redaction, TraceFormData } from "../types";
import { ScreenGesture } from "@prisma/client";
import { useNavigation } from "./repair-screen";
import { useFormContext } from "react-hook-form";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleAlert, X } from "lucide-react";
import Kbd from "@/components/ui/kbd";
import Image from "next/image";
import { card } from "./util";
import { spring } from "@/lib/motion";

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
  const { focusViewIndex, setFocusViewIndex } = useNavigation();
  const { setValue } = useFormContext<TraceFormData>();

  const setFrameData = (value: FrameData[]) => setValue("screens", value);
  const setGestureData = (value: { [key: string]: ScreenGesture }) => {
    setValue("gestures", value);
  };
  const setRedactionData = (value: { [key: string]: Redaction[] }) => {
    setValue("redactions", value);
  };

  const handleDeleteFrame = (index: number) => {
    // reset focus view index
    setFocusViewIndex(-1);
    // remove frame from view
    const newFrameData = [...screens];
    newFrameData.splice(index, 1);
    setFrameData(newFrameData);
    // remove frame from gestures
    const updatedGestures = Object.fromEntries(
      Object.entries(gestures).filter(([key]) => key !== screens[index].id)
    );
    setGestureData(updatedGestures);
    // remove frame from redactions
    const updatedRedactions = Object.fromEntries(
      Object.entries(redactions).filter(([key]) => key !== screens[index].id)
    );
    setRedactionData(updatedRedactions);
  };

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

  const updateSize = () => {
    if (containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const imageRect = imageRef.current.getBoundingClientRect();
      const naturalWidth = imageRef.current.naturalWidth;
      const naturalHeight = imageRef.current.naturalHeight;
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
  };

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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
            onClick={() => handleDeleteFrame(index)}
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
            {screen.src && (
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
              />
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
