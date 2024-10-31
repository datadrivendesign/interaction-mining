"use client";

import { createContext, useState, useContext, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import classNames from "classnames";
import { Download, Search } from "lucide-react";

import { prettyTime } from "@/lib/utils/date";
import { Trace, Screen } from "@prisma/client";
import { trace } from "console";

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
  data: Trace[];
  children: React.ReactNode;
}) {
  const [_data, setData] = useState<any[]>(data);
  const [inspectData, setInspectData] = useState<any>(data[0] || null);

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
      const trace = data.find((a) => (a.id === traceId));

      if (trace) {
        setInspectData(trace)
      }
    }
  }, [traceId])

  return (
    <div className="flex grow w-full max-w-screen-2xl h-full place-self-center md:px-16 gap-2">
      <aside className="flex flex-col grow shrink-0 basis-full md:basis-[320px] p-2 md:p-0">
        {data.map((data, index) => (
          <div
            key={index}
            className={classNames(
              "flex flex-col p-3 md:p-4 cursor-pointer",
              inspectData?.id === data?.id
                ? "bg-neutral-100 rounded-xl"
                : "bg-transparent"
            )}
            onClick={() => setInspectData(data)}
          >
            <h2 className="text-lg md:text-xl font-bold tracking-tight line-clamp-1">
              {data?.name || "Untitled Trace"}
            </h2>
            <div className="flex w-full">
              <span className="text-sm md:text-base mr-2 whitespace-nowrap">
                {prettyTime(data?.created, {
                  format: "LL/dd/yy",
                })}
              </span>
              <span className="text-sm md:text-base text-neutral-500 line-clamp-1">
                {data?.description}
              </span>
            </div>
          </div>
        ))}
      </aside>
      <div className="flex flex-col basis-full md:basis-[1216px] max-w-[1216px] overflow-x-hidden">
        {inspectData ? (
          <InspectView data={inspectData} />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <Search size={48} className="text-neutral-300 mb-2" />
            <span className="text-lg font-semibold text-neutral-300 tracking-tight">
              Select a trace to inspect
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function InspectView({ data }: { data: Trace }) {
  console.log(data);
  return (
    <div className="flex flex-col grow w-full h-full p-4 pr-0">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {data?.name || "Untitled Trace"}
        </h1>
        <div className="flex gap-2">
          <Link
            className="inline-flex items-center gap-1 px-3 py-0 rounded-xl bg-neutral-100 text-black font-semibold tracking-tight leading-none"
            href={`/app/${data.appId}/editor?trace=${data.id}`}
            target="_blank"
          >
            Open in editor...
          </Link>
          <button className="inline-flex items-center gap-1 px-3 py-0 rounded-xl bg-neutral-900 text-white font-semibold tracking-tight leading-none">
            <Download className="size-4" />
            Download
          </button>
        </div>
      </div>
      <span className="text-sm text-neutral-500 mb-2">
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
        <h2 className="text-xl text-black font-bold tracking-tight">
          Description
        </h2>
        <p className="text-sm text-neutral-500">{data?.description}</p>
      </section>
      <section className="block w-full mb-4">
        <h2 className="text-xl text-black font-bold tracking-tight mb-2">
          Images
        </h2>
        <div className="flex w-full overflow-x-scroll touch-pan-x pb-3">
          <div className="flex min-w-full gap-2">
            {data?.screens.map((screen: Screen, index: number) => (
              <figure
                key={index}
                className="relative flex flex-col shrink-0 w-48 border border-neutral-500/10 rounded-lg shadow-sm overflow-clip"
              >
                <Image
                  src={screen?.src}
                  alt={`screen-${screen?.id}`}
                  className="object-contain w-full h-auto"
                  width={0}
                  height={0}
                  sizes="100vw"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
