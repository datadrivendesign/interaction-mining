"use client";
import React, { useCallback, useState } from "react";
import Image from "next/image";
import { CircleAlert } from "lucide-react";


import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { cn } from "@/lib/utils";
import RedactScreenCanvas from "./redact-screen-canvas";
import { FrameData } from "./extract-frames";

type Trace = any;

export default function RedactScreen({ data }: { data: FrameData[] }) {
  const [focusViewValue, setFocusViewValue] = useState<{
    current: FrameData | null;
    next: FrameData | null;
  }>({
    current: null,
    next: null,
  });

  const handleFocusView = useCallback(
    (index: number) => {
      setFocusViewValue({
        current: data[index],
        next: data[index + 1] ?? null,
      });
    },
    [data]
  );

  return (
    <div className="w-full h-[calc(100dvh-var(--nav-height))]">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={10} maxSize={75}>
          <Filmstrip data={data} handleFocusView={handleFocusView} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          {focusViewValue.current ? (
            <FocusView screen={focusViewValue.current} />
          ) : (
            <div className="flex justify-center items-center w-full h-full">
              <span className="text-3xl lg:text-4xl text-neutral-500 dark:text-neutral-400 font-semibold">
                Select a screen from the filmstrip.
              </span>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function Filmstrip({
  data,
  handleFocusView,
}: {
  data: FrameData[];
  handleFocusView: (index: number) => void;
}) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(150px,2fr))] gap-4 max-h-[90vh] px-3 pt-4 pb-2 overflow-y-auto">
      {data.map((screen: FrameData, index: number) => (
        <FilmstripItem
          key={screen.timestamp}
          index={index}
          isBroken={true}
          onClick={() => handleFocusView(index)}
        >
          <Image
            key={screen.timestamp}
            src={screen.url}
            alt="gallery"
            draggable={false}
            className="w-full h-auto object-contain rounded-md"
            width={0}
            height={0}
            sizes="100vw"
            onClick={() => handleFocusView(index)}
          />
        </FilmstripItem>
      ))}
    </ul>
  );
}

function FilmstripItem({
  index = 0,
  children,
  isBroken = false,
  ...props
}: {
  index?: number;
  children?: React.ReactNode;
  isBroken?: boolean;
} & React.HTMLAttributes<HTMLLIElement>) {
  return (
    <>
      <li
        className="cursor-pointer min-h-fit w-full"
        data-index={index}
        {...props}
      >
        <div className="relative min-h-fit w-full rounded-sm overflow-clip transition-all duration-200 ease-in-out select-none object-contain">
          {isBroken && (
            <div className="absolute z-10 flex w-full h-full justify-center items-center rounded-sm ring-2 ring-inset ring-red-400">
              <CircleAlert className="size-6 text-red-400" />
            </div>
          )}
          <div
            className={cn(
              "relative min-h-fit w-full transition-all duration-200 ease-in-out select-none",
              isBroken
                ? "grayscale brightness-50"
                : "grayscale-0 brightness-100"
            )}
          >
            {children}
          </div>
        </div>
      </li>
    </>
  );
}

function FocusView({ screen }: { screen: FrameData }) {
  return (
    <>
      <div className="flex justify-center w-full h-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <RedactScreenCanvas screen={screen} />
      </div>
    </>
  );
}
