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
import { gestureOptions } from "@/lib/utils/gesture-options";
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
          "flex-col shrink-0 basis-full md:basis-[320px] h-full min-h-0 border-r border-muted-background divide-y divide-dimmed-background overflow-auto"
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
    </div>
  );
}

export function InspectView({ data }: { data: Trace }) {
  const { setInspectData } = useContext(GalleryContext);
  const [loading, setLoading] = useState({ status: "loading" });

  const handleImageLoad = useCallback(() => {
    setLoading({ status: "loaded" });
  }, []);

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
              <div key={screen.id}>
                <figure className="relative flex flex-col shrink-0 w-48 border border-neutral-500/10 rounded-lg shadow-xs overflow-hidden">
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
                          <p>{screen.gesture.type}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {(screen.redactions || []).map((redaction, i) => (
                      <Tooltip key={`${redaction.annotation}-${i}`}>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute z-10 bg-black border-1 border-yellow-500 cursor-pointer hover:shadow-yellow-500/50 hover:shadow-lg"
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
                {/* Gesture caption */}
                <div className="prose prose-neutral dark:prose-invert leading-snug font-xs font-semibold dark:text-neutral-900 overflow-auto h-full w-full whitespace-pre-wrap">
                  <p className="text-xs text-center dark:text-neutral-300">
                    {screen.gesture.description ?? ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
