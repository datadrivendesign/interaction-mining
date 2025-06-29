// @ts-nocheck
"use client";

import { usePathname, useParams } from "next/navigation";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Image from "next/image";
import clsx from "clsx";
import { motion } from "motion/react";
import {
  ArrowDownFromLine,
  ArrowLeft,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  ArrowUpFromLine,
  Circle,
  CircleDot,
  CircleHelp,
  CircleStop,
  Expand,
  Grab,
  IterationCcw,
  IterationCw,
  Search,
  Shrink,
  Download,
} from "lucide-react";

import { prettyTime } from "@/lib/utils/date";
import { Screen } from "@prisma/client";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { GestureOption } from "@/app/(signed-in)/capture/[captureId]/edit/components/types";
import { Button } from "@/components/ui/button";
import { downloadTrace } from "../lib";

const GalleryContext = createContext({
  data: [] as any[],
  setData: (_: any) => { },
  inspectData: null as any,
  setInspectData: (_: any) => { },
});

export function GalleryRoot({
  data,
  children,
}: {
  data: any;
  children: React.ReactNode;
}) {
  const [_data, setData] = useState<any[]>(data);
  const [inspectData, setInspectData] = useState<any>(null);

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
                : "bg-transparent"
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
    </div >
  );
}

export function InspectView({ data }: { data: any }) {
  const { setInspectData } = useContext(GalleryContext);
  const [loading, setLoading] = useState({ status: "loading" });

  const handleImageLoad = useCallback(() => {
    setLoading({ status: "loaded" });
  }, []);

  const gestureOptions = useMemo<GestureOption[]>(
    () => [
      {
        value: "tap",
        label: "Tap",
        icon: <Circle className="size-4 text-yellow-800 hover:text-black" />,
      },
      {
        value: "double tap",
        label: "Double tap",
        icon: <CircleDot className="size-4 text-yellow-800 hover:text-black" />,
      },
      {
        value: "touch and hold",
        label: "Touch and hold",
        icon: (
          <CircleStop className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "swipe",
        label: "Swipe",
        subGestures: [
          {
            value: "swipe up",
            label: "Swipe up",
            icon: (
              <ArrowUpFromLine className="size-4 text-yellow-800 hover:text-black" />
            ),
          },
          {
            value: "swipe down",
            label: "Swipe down",
            icon: (
              <ArrowDownFromLine className="size-4 text-yellow-800 hover:text-black" />
            ),
          },
          {
            value: "swipe left",
            label: "Swipe left",
            icon: (
              <ArrowLeftFromLine className="size-4 text-yellow-800 hover:text-black" />
            ),
          },
          {
            value: "swipe right",
            label: "Swipe right",
            icon: (
              <ArrowRightFromLine className="size-4 text-yellow-800 hover:text-black" />
            ),
          },
        ],
      },
      {
        value: "drag",
        label: "Drag",
        icon: <Grab className="size-4 text-yellow-800 hover:text-black" />,
      },
      {
        value: "zoom",
        label: "Zoom",
        subGestures: [
          {
            value: "zoom in",
            label: "Zoom in",
            icon: (
              <Shrink className="size-4 text-yellow-800 hover:text-black" />
            ),
          },
          {
            value: "zoom out",
            label: "Zoom out",
            icon: (
              <Expand className="size-4 text-yellow-800 hover:text-black" />
            ),
          },
        ],
      },
      {
        value: "rotate",
        label: "Rotate",
        subGestures: [
          {
            value: "rotate cw",
            label: "Rotate cw",
            icon: (
              <IterationCw className="size-4 text-yellow-800 hover:text-black" />
            ),
          },
          {
            value: "rotate ccw",
            label: "Rotate ccw",
            icon: (
              <IterationCcw className="size-4 text-yellow-800 hover:text-black" />
            ),
          },
        ],
      },
      {
        value: "other",
        label: "Other",
        icon: (
          <CircleHelp className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
    ],
    []
  );

  const handleDownload = useCallback(() => {
    downloadTrace(data);
  }, [data]);

  return (
    <div className="flex flex-col grow w-full h-full p-4 md:p-6 pr-0">
      <button
        onClick={() => setInspectData(null)}
        className="inline-flex md:hidden cursor-pointer mb-2"
      >
        <ArrowLeft className="cursor-pointer size-6 text-muted-foreground mr-1" />
        <span className="text-base text-muted-foreground font-semibold">
          Back
        </span>
      </button>
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-4">
        <section>
          <h1 className="text-lg font-bold tracking-tight">
            {data?.description}
          </h1>
          <span className="text-sm text-muted-foreground mb-2">
            Created on{" "}
            {prettyTime(data?.created, {
              format: "LLLL dd, yyyy",
            })}
            {" at "}
            {prettyTime(data?.created, {
              format: "hh:mm a",
            })}
          </span>
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
      <section className="block w-full mb-4">
        <div className="flex w-full overflow-x-scroll touch-pan-x pb-3">
          <div className="flex min-w-full gap-2">
            {data?.screens.map((screen: Screen, index: number) => (
              <figure
                key={screen.id}
                className="relative flex flex-col shrink-0 w-48 border border-neutral-500/10 rounded-lg shadow-xs overflow-hidden"
              >
                <motion.div
                  animate={{ opacity: loading.status === "loading" ? 1 : 0 }}
                  className="absolute z-10 flex w-full h-full"
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-full h-full bg-neutral-100 dark:bg-neutral-900 animate-pulse"></div>
                </motion.div>
                <Image
                  src={screen?.src}
                  alt={`screen-${screen?.id}`}
                  className={clsx(
                    loading.status === "loading" ? "invisible" : "visible",
                    "relative z-0 object-contain w-full h-auto"
                  )}
                  width={0}
                  height={0}
                  sizes="100vw"
                  priority
                  onLoad={handleImageLoad}
                />
                {(screen.gesture.x !== null && screen.gesture.y !== null) &&
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute z-20 flex items-center justify-center w-6 bg-yellow-400 opacity-75 hover:opacity-100 cursor-pointer rounded-full aspect-square -translate-x-1/2 -translate-y-1/2 transition-opacity duration-100 ease-in-out"
                          style={{
                            left: `${(screen.gesture.x ?? 0) * 100}%`,
                            top: `${(screen.gesture.y ?? 0) * 100}%`,
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
                                  screen.gesture.type?.toLowerCase()
                              )?.icon
                          }
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-50">
                        <p>{screen.gesture.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>}
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
