"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useReducer,
} from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { motion } from "motion/react";
import { ArrowLeft, Search } from "lucide-react";

import { prettyTime } from "@/lib/utils/date";
import { Screen } from "@prisma/client";

const GalleryContext = createContext({
  data: [] as any[],
  setData: (_: any) => {},
  inspectData: null as any,
  setInspectData: (_: any) => {},
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

export function Gallery({ traceId }: { traceId: string }) {
  const { data, inspectData, setInspectData } = useContext(GalleryContext);

  useEffect(() => {
    // if traceId is passed in, set current view to specified trace
    if (traceId) {
      const trace = data.find((a) => a.id === traceId);

      if (trace) {
        setInspectData(trace);
      }
    }
  }, [traceId, data, setInspectData]);

  return (
    <div className="flex grow w-full max-w-screen-2xl h-full place-self-center gap-2">
      <aside
        className={clsx(
          "flex-col grow shrink-0 basis-full lg:basis-[320px] lg:pl-4",
          inspectData ? "hidden lg:flex" : "flex"
        )}
      >
        {data.map((data, index) => (
          <div
            key={index}
            className={clsx(
              "flex flex-col px-4 py-4 cursor-pointer rounded-none lg:rounded-xl border-b-2 lg:border-none border-neutral-100 dark:border-neutral-900",
              inspectData?.id === data?.id
                ? "bg-neutral-100 dark:bg-neutral-900"
                : "bg-transparent"
            )}
            onClick={() => setInspectData(data)}
          >
            <h2 className="text-lg md:text-xl font-bold tracking-tight line-clamp-1">
              {data?.name || "Untitled Trace"}
            </h2>
            <span className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 line-clamp-1">
              {data?.description}
            </span>
          </div>
        ))}
      </aside>
      <div className="flex flex-col basis-full lg:basis-[1216px] max-w-[1216px] overflow-x-hidden pr-4">
        {inspectData ? (
          <InspectView data={inspectData} />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <Search
              size={48}
              className="text-neutral-500 dark:text-neutral-400 mb-2"
            />
            <span className="text-lg font-semibold text-neutral-400 tracking-tight">
              Select a trace to inspect
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function loadingReducer(state: any, action: any) {
  if (action.type === "OVERRIDE") {
    return { status: action.status, imagesLoading: action.imagesLoading };
  }
  if (action.type === "LOAD_IMAGE") {
    if (state.imagesLoading === 1) {
      return { status: "loaded", imagesLoading: 0 };
    } else {
      return { status: "loading", imagesLoading: state.imagesLoading - 1 };
    }
  }
  return action;
}

export function InspectView({ data }: { data: any }) {
  const { setInspectData } = useContext(GalleryContext);
  const [loading, setLoading] = useReducer(loadingReducer, {
    status: "loading",
    imagesLoading: data.screens.length,
  });

  useEffect(() => {
    setLoading({
      type: "OVERRIDE",
      status: "loading",
      imagesLoading: data.screens.length,
    });
  }, [data]);

  const handleImageLoad = useCallback(() => {
    if (loading.status === "loading") {
      setLoading({ type: "LOAD_IMAGE" });
    }
  }, [loading]);

  return (
    <div className="flex flex-col grow w-full h-full p-4 pr-0">
      <button
        onClick={() => setInspectData(null)}
        className="inline-flex lg:hidden cursor-pointer mb-2"
      >
        <ArrowLeft className="cursor-pointer size-6 text-neutral-500 dark:text-neutral-400 mr-1" />
        <span className="text-base text-neutral-500 dark:text-neutral-400 font-semibold">
          Back
        </span>
      </button>
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {data?.name || "Untitled Trace"}
        </h1>
        {/* <div className="hidden lg:flex gap-2">
          <Link
            className="inline-flex items-center gap-1 px-3 py-0 rounded-xl bg-neutral-100 text-black font-semibold tracking-tight leading-none"
            href={`/editor?trace=${data.id}`}
            target="_blank"
          >
            Open in editor...
          </Link>
          <button className="inline-flex items-center gap-1 px-3 py-0 rounded-xl bg-neutral-900 text-white font-semibold tracking-tight leading-none">
            <Download className="size-4" />
            Download
          </button>
        </div> */}
        <div className="hidden lg:flex gap-2">
          <Link
            className="inline-flex items-center gap-1 px-3 py-0 rounded-xl bg-neutral-100 text-black font-semibold tracking-tight leading-none"
            href={`/trace/${data.id}`}
            target="_blank"
          >
            Open in Trace Inspector
          </Link>
        </div>
      </div>
      <span className="text-base text-neutral-500 dark:text-neutral-400 mb-2">
        Created on{" "}
        {prettyTime(data?.created, {
          format: "LLLL dd, yyyy",
        })}
        {" at "}
        {prettyTime(data?.created, {
          format: "hh:mm a",
        })}
      </span>
      <section className="block w-full mb-4">
        <h2 className="text-xl font-bold tracking-tight">Task</h2>
        <p className="text-base text-neutral-500 dark:text-neutral-400 mb-2">
          {data?.description}
        </p>
      </section>
      <section className="block w-full mb-4">
        <div className="flex w-full overflow-x-scroll touch-pan-x pb-3">
          <div className="flex min-w-full gap-2">
            {data?.screens.map((screen: Screen, index: number) => (
              <figure
                key={index}
                className="relative flex flex-col shrink-0 w-48 border border-neutral-500/10 rounded-lg shadow-xs overflow-clip"
              >
                <motion.div
                  animate={{ opacity: loading.status === "loading" ? 1 : 0 }}
                  className="absolute z-10 flex w-full h-full"
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-full h-full bg-neutral-100 animate-pulse"></div>
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
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
