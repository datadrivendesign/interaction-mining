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
    <div className="flex h-full min-h-0 w-full max-w-screen-2xl flex-1 place-self-center">
      <aside
        className={clsx(
          inspectData ? "hidden md:flex" : "flex",
          "h-full min-h-0 shrink-0 basis-full flex-col divide-y divide-dimmed-background overflow-auto border-r border-muted-background md:basis-[320px]",
        )}
      >
        {data.map((data, index) => (
          <div
            key={index}
            className={clsx(
              "flex cursor-pointer flex-col p-4",
              inspectData?.id === data?.id
                ? "bg-muted-background"
                : "bg-transparent",
            )}
            onClick={() => setInspectData(data)}
          >
            <h2 className="line-clamp-1 text-base font-medium">
              {data?.description}
            </h2>
            <span className="line-clamp-1 text-sm text-muted-foreground">
              {prettyTime(data?.created, {
                format: "LLLL dd, yyyy",
              })}
            </span>
          </div>
        ))}
      </aside>
      <div className="flex max-w-[1216px] basis-full flex-col overflow-x-hidden pr-4 md:basis-[1216px]">
        {inspectData ? (
          <InspectView data={inspectData} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <Search size={48} className="mb-2 text-muted-foreground" />
            <span className="text-lg font-semibold tracking-tight text-neutral-400">
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
        "flex min-h-0 shrink-0 flex-col items-center gap-1",
        isLandscape ? "" : "max-w-[13rem]",
      )}
      style={thumbStyle}
    >
      <div
        className={clsx(
          "relative flex min-h-0 max-w-full items-center justify-center",
          naturalSize ? "w-full" : "",
        )}
      >
        <motion.div
          animate={{ opacity: loaded ? 0 : 1 }}
          className="absolute inset-0 z-10 flex items-center justify-center"
          transition={{ duration: 0.5 }}
        >
          <div
            className="h-64 w-28 max-w-full animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-900"
            style={{ maxHeight: imageMaxHeight }}
          />
        </motion.div>
        <figure
          ref={containerRef}
          className={clsx(
            "relative inline-flex max-w-full overflow-hidden rounded-lg border border-neutral-500/10 leading-none shadow-xs",
            naturalSize ? "w-full" : "w-[min(13rem,100%)]",
          )}
          style={figureStyle}
        >
          <div className="absolute top-2 right-2 z-30 rounded-full border border-white/25 bg-black/20 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            {index + 1}
          </div>
          <Image
            src={screen?.src}
            alt={`screen-${screen?.id}`}
            className={clsx(
              loaded ? "visible" : "invisible",
              "relative z-0 block h-full w-full object-contain",
            )}
            width={0}
            height={0}
            sizes="100vw"
            priority
            onLoad={handleLoad}
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
                    className="absolute z-20 flex aspect-square w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-yellow-400 opacity-75 transition-opacity duration-100 ease-in-out hover:opacity-100"
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
                    className="absolute z-15 cursor-pointer border-1 border-yellow-500 bg-black hover:shadow-lg hover:shadow-yellow-500/50"
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
      <div className="prose h-16 w-full shrink-0 overflow-y-auto pt-1 leading-snug font-semibold whitespace-pre-wrap prose-neutral dark:prose-invert dark:text-neutral-900">
        {description ? (
          <p className="text-center text-xs dark:text-neutral-300">
            {description}
          </p>
        ) : isFinalScreen ? (
          <div className="flex justify-center">
            <span className="inline-flex items-center rounded-md border border-green-500/25 bg-green-500/10 px-2 py-1 text-[11px] font-semibold tracking-wide text-green-700 uppercase dark:text-green-300">
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
    <div className="flex h-full min-h-0 w-full grow flex-col overflow-hidden p-4 pr-0 md:p-6">
      <button
        onClick={() => setInspectData(null)}
        className="mb-2 inline-flex cursor-pointer md:hidden"
      >
        <ArrowLeft className="mr-1 size-6 cursor-pointer text-muted-foreground" />
        <span className="text-base font-semibold text-muted-foreground">
          Back
        </span>
      </button>
      <div className="mb-4 flex shrink-0 flex-col items-start justify-between gap-4 lg:flex-row">
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
        <div className="hidden gap-2 md:flex">
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
      <section className="mb-4 min-h-0 w-full flex-1">
        <div
          ref={scrollContainerRef}
          className="flex h-full w-full touch-pan-x overflow-x-auto overflow-y-hidden pb-3"
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
