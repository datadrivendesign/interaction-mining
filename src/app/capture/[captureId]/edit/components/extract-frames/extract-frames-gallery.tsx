import Image from "next/image";
import React, { useEffect } from "react";
import { FrameData } from "./extract-frames";
import { prettyNumber } from "@/lib/utils/number";
import { X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { TraceFormData } from "../../page";

export default function FrameGallery({
  frames,
  setTime,
}: {
  frames: FrameData[];
  setTime: (_: number) => void;
}) {
  const { watch, setValue } = useFormContext<TraceFormData>();

  const setFrameData = (value: FrameData[]) => setValue("screens", value);

  const handleDeleteFrame = (index: number) => {
    const newFrameData = [...frames];
    newFrameData.splice(index, 1);
    setFrameData(newFrameData);
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 items-start w-full h-full gap-6 p-6">
      {frames.map((frame, index) => (
        <div
          className="flex flex-col p-2 bg-neutral-100 dark:bg-neutral-900 rounded-xl"
          key={`${frame.timestamp}-${index}`}
        >
          {/* Toolbar */}
          <div className="flex flex-row w-full items-center justify-between mb-2">
            <div
              className="group flex p-1 justify-center items-center bg-neutral-800 rounded-lg"
              onClick={() => setTime(frame.timestamp)}
            >
              <span
                className="text-sm text-neutral-500 dark:text-neutral-400 tracking-tight leading-none slashed-zero tabular-nums group-hover:underline cursor-pointer"
                title={`Jump to timestamp: ${prettyNumber(frame.timestamp)}s`}
              >
                {`${prettyNumber(frame.timestamp)}s`}
              </span>
            </div>
            <button
              onClick={() => handleDeleteFrame(index)}
              className="inline-flex self-end items-center cursor-pointer"
              title="Delete snapshot"
            >
              <X className="size-6 text-neutral-500 dark:text-neutral-400 hover:opacity-75" />
            </button>
          </div>
          <Image
            className="z-0 object-cover w-full h-auto rounded-lg"
            src={frame.url}
            alt={`Extracted frame at ${frame.timestamp}`}
            draggable={false}
            width={0}
            height={0}
            sizes="100vw"
          />
        </div>
      ))}
    </div>
  );
}
