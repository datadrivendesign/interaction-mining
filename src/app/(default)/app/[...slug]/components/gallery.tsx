"use client";

import { usePathname, useParams } from "next/navigation";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import Image from "next/image";
import clsx from "clsx";
import { motion } from "motion/react";
import { ArrowLeft, Search, Download } from "lucide-react";

import { prettyTime } from "@/lib/utils/date";
import { Screen } from "@prisma/client";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  findGestureOption,
  normalizeGestureType,
} from "@/lib/utils/gesture-options";
import { GESTURE_TYPES } from "@/lib/utils/gesture-types";
import { useMeasure } from "@uidotdev/usehooks";
import { downloadTrace } from "../lib";
import { Trace } from "@/lib/actions";

const GalleryContext = createContext({
  data: [] as Trace[],
  setData: (_: Trace[]) => {},
  inspectData: null as Trace | null,
  setInspectData: (_: Trace | null) => {},
});

export function GalleryRoot({
  data,
  children,
}: {
  data: Trace[];
  children: React.ReactNode;
}) {
  const [_data, setData] = useState<Trace[]>(data);
  const [inspectData, setInspectData] = useState<Trace | null>(null);

  return (
    <GalleryContext.Provider
      value={{
        data: _data,
        setData,
        inspectData,
        setInspectData,
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function Gallery() {
  const { data, inspectData, setInspectData } = useContext(GalleryContext);

  const params = useParams();
  const appId = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const pathname = usePathname();

  // Initialize selected trace from URL on mount / path change
  useEffect(() => {
    const match = window.location.pathname.match(/\/trace\/([^/]+)/);
    const id = match ? match[1] : null;
    if (id) {
      const trace = data.find((a) => a.id === id);
      if (trace) {
        setInspectData(trace);
      }
    }
  }, [pathname, data, setInspectData]);

  // Sync browser history when inspectData changes via clicks
  useEffect(() => {
    if (inspectData) {
      window.history.pushState({}, "", `/app/${appId}/trace/${inspectData.id}`);
    } else {
      window.history.pushState({}, "", `/app/${appId}`);
    }
  }, [inspectData, appId]);

  return (
    <div className="flex w-full max-w-screen-2xl h-full min-h-0 flex-1 place-self-center">
      <aside
        className={clsx(
          inspectData ? "hidden md:flex" : "flex",
          "flex-col shrink-0 basis-full md:basis-[320px] h-full min-h-0 border-r border-muted-background divide-y divide-dimmed-background overflow-auto",
        )}
      >
        {data.map((data, index) => (
          <div
            key={index}
            className={clsx(
              "flex flex-col p-4 cursor-pointer",
              inspectData?.id === data?.id
                ? "bg-muted-background"
                : "bg-transparent",
            )}
            onClick={() => setInspectData(data)}
          >
            <h2 className="text-base font-medium line-clamp-1">
              {data?.description}
            </h2>
            <span className="text-sm text-muted-foreground line-clamp-1">
              {prettyTime(data?.created, {
                format: "LLLL dd, yyyy",
              })}
            </span>
          </div>
        ))}
      </aside>
      <div className="flex flex-col basis-full md:basis-[1216px] max-w-[1216px] overflow-x-hidden pr-4">
        {inspectData ? (
          <InspectView data={inspectData} />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <Search size={48} className="text-muted-foreground mb-2" />
            <span className="text-lg font-semibold text-neutral-400 tracking-tight">
              Select a trace to inspect
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ScreenThumb({
  screen,
  index,
  total,
  imageMaxHeightPx,
}: {
  screen: Screen;
  index: number;
  total: number;
  imageMaxHeightPx: number | null;
}) {
  const [loaded, setLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [containerRef, { width, height }] = useMeasure();
  const canvasWidth = width ?? 0;
  const canvasHeight = height ?? 0;

  const isLandscape =
    naturalSize !== null && naturalSize.width > naturalSize.height;
  const aspectRatio = naturalSize
    ? `${naturalSize.width} / ${naturalSize.height}`
    : undefined;
  const imageMaxHeight = imageMaxHeightPx
    ? `${imageMaxHeightPx}px`
    : "calc(100dvh - 22rem)";
  const imageAspect = naturalSize ? naturalSize.width / naturalSize.height : 1;
  const thumbWidth = naturalSize
    ? `min(${naturalSize.width}px, calc(${imageMaxHeight} * ${imageAspect}), ${
        isLandscape ? "100%" : "13rem"
      })`
    : undefined;
  const figureStyle: React.CSSProperties = {
    aspectRatio,
    ...(thumbWidth ? { width: thumbWidth } : null),
  };
  const thumbStyle: React.CSSProperties | undefined = thumbWidth
    ? { width: thumbWidth }
    : undefined;
  const isFinalScreen = index === total - 1;
  const description = screen.gesture.description?.trim();
  const isDrag =
    screen.gesture &&
    normalizeGestureType(screen.gesture.type) === GESTURE_TYPES.DRAG &&
    screen.gesture.x !== null &&
    screen.gesture.y !== null &&
    screen.gesture.scrollDeltaX !== null &&
    screen.gesture.scrollDeltaY !== null &&
    canvasWidth > 0 &&
    canvasHeight > 0;

  const startX = isDrag ? screen.gesture.x! * canvasWidth : 0;
  const startY = isDrag ? screen.gesture.y! * canvasHeight : 0;
  const endX = isDrag
    ? (screen.gesture.x! + screen.gesture.scrollDeltaX!) * canvasWidth
    : 0;
  const endY = isDrag
    ? (screen.gesture.y! + screen.gesture.scrollDeltaY!) * canvasHeight
    : 0;

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      if (img.naturalWidth && img.naturalHeight) {
        setNaturalSize({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      }
      setLoaded(true);
    },
    [],
  );

  return (
    <div
      className={clsx(
        "flex flex-col items-center shrink-0 min-h-0 gap-1",
        isLandscape ? "" : "max-w-[13rem]",
      )}
      style={thumbStyle}
    >
      <div
        className={clsx(
          "relative min-h-0 flex items-center justify-center max-w-full",
          naturalSize ? "w-full" : "",
        )}
      >
        <motion.div
          animate={{ opacity: loaded ? 0 : 1 }}
          className="absolute inset-0 z-10 flex items-center justify-center"
          transition={{ duration: 0.5 }}
        >
          <div
            className="h-64 w-28 max-w-full rounded-lg bg-neutral-100 dark:bg-neutral-900 animate-pulse"
            style={{ maxHeight: imageMaxHeight }}
          />
        </motion.div>
        <figure
          ref={containerRef}
          className={clsx(
            "relative inline-flex max-w-full border border-neutral-500/10 rounded-lg shadow-xs overflow-hidden leading-none",
            naturalSize ? "w-full" : "w-[min(13rem,100%)]",
          )}
          style={figureStyle}
        >
          <div className="absolute right-2 top-2 z-30 rounded-full border border-white/25 bg-black/20 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            {index + 1}
          </div>
          <Image
            src={screen?.src}
            alt={`screen-${screen?.id}`}
            className={clsx(
              loaded ? "visible" : "invisible",
              "relative z-0 block object-contain w-full h-full",
            )}
            width={0}
            height={0}
            sizes="100vw"
            priority
            onLoad={handleLoad}
          />
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
          <TooltipProvider delayDuration={100}>
            {screen.gesture.x !== null && screen.gesture.y !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="absolute z-20 flex items-center justify-center w-6 bg-yellow-400 opacity-75 hover:opacity-100 cursor-pointer rounded-full aspect-square -translate-x-1/2 -translate-y-1/2 transition-opacity duration-100 ease-in-out"
                    style={{
                      left: `${(screen.gesture.x ?? 0) * 100}%`,
                      top: `${(screen.gesture.y ?? 0) * 100}%`,
                    }}
                  >
                    {findGestureOption(screen.gesture.type)?.icon}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="z-50">
                  <p>{screen.gesture.type}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {(screen.redactions || []).map((redaction, i) => (
              <Tooltip key={`${redaction.annotation}-${i}`}>
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
            ))}
          </TooltipProvider>
        </figure>
      </div>
      {/* Gesture caption */}
      <div className="prose prose-neutral dark:prose-invert leading-snug font-semibold dark:text-neutral-900 shrink-0 h-16 w-full overflow-y-auto whitespace-pre-wrap pt-1">
        {description ? (
          <p className="text-xs text-center dark:text-neutral-300">
            {description}
          </p>
        ) : isFinalScreen ? (
          <div className="flex justify-center">
            <span className="inline-flex items-center rounded-md border border-green-500/25 bg-green-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
              Final Screen
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function InspectView({ data }: { data: Trace }) {
  const { setInspectData } = useContext(GalleryContext);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [imageMaxHeightPx, setImageMaxHeightPx] = useState<number | null>(null);

  const handleDownload = useCallback(() => {
    downloadTrace(data);
  }, [data]);

  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    const CAPTION_RESERVE_PX = 72;
    const MIN_IMAGE_HEIGHT_PX = 180;

    const updateImageBudget = () => {
      const rect = element.getBoundingClientRect();
      const nextHeight = Math.max(
        MIN_IMAGE_HEIGHT_PX,
        Math.floor(rect.height - CAPTION_RESERVE_PX),
      );
      setImageMaxHeightPx((prev) =>
        prev !== null && Math.abs(prev - nextHeight) < 1 ? prev : nextHeight,
      );
    };

    updateImageBudget();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateImageBudget);
      return () => {
        window.removeEventListener("resize", updateImageBudget);
      };
    }

    const resizeObserver = new ResizeObserver(updateImageBudget);
    resizeObserver.observe(element);
    window.addEventListener("resize", updateImageBudget);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateImageBudget);
    };
  }, []);

  return (
    <div className="flex flex-col grow w-full h-full min-h-0 overflow-hidden p-4 md:p-6 pr-0">
      <button
        onClick={() => setInspectData(null)}
        className="inline-flex md:hidden cursor-pointer mb-2"
      >
        <ArrowLeft className="cursor-pointer size-6 text-muted-foreground mr-1" />
        <span className="text-base text-muted-foreground font-semibold">
          Back
        </span>
      </button>
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-4 shrink-0">
        <section>
          <h1 className="text-lg font-bold tracking-tight">
            {data?.description}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>
              Created on{" "}
              {prettyTime(data?.created, {
                format: "LLLL dd, yyyy",
              })}
              {" at "}
              {prettyTime(data?.created, {
                format: "hh:mm a",
              })}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {data?.screens.length}{" "}
              {data?.screens.length === 1 ? "screen" : "screens"}
            </span>
          </div>
        </section>
        <div className="hidden md:flex gap-2">
          <Button
            variant={"secondary"}
            onClick={handleDownload}
            tooltip="Download trace data"
          >
            <Download className="size-4" />
            Download trace
          </Button>
        </div>
      </div>
      <section className="flex-1 min-h-0 w-full mb-4">
        <div
          ref={scrollContainerRef}
          className="flex h-full w-full overflow-x-auto overflow-y-hidden touch-pan-x pb-3"
        >
          <div className="flex h-full items-start gap-4">
            {data?.screens.map((screen: Screen, index: number) => (
              <ScreenThumb
                key={screen.id}
                screen={screen}
                index={index}
                total={data.screens.length}
                imageMaxHeightPx={imageMaxHeightPx}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
