"use client";
import React from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormContext } from "react-hook-form";
import { CaptureFormData } from "../../page";

export default function Review() {
  const { register } = useFormContext<CaptureFormData>();

  return (
    <div className="flex flex-row w-full h-[calc(100dvh-var(--nav-height))] gap-4 p-8 pb-0">
      <div className="flex w-2/3 h-full overflow-auto">
        <SaveTraceGallery />
      </div>
      <div className="flex flex-col shrink-0 grow-0 justify-center items-center w-1/3 h-full mb-4">
        <div className="flex flex-col w-full grow justify-start">
          <Label htmlFor="description" className="mb-2">
            Trace Description
          </Label>
          <Textarea
            {...register("description")}
            id="description"
            placeholder="Describe how you completed your task"
          />
        </div>
      </div>
    </div>
  );
}

function SaveTraceGallery() {
  const { watch } = useFormContext<CaptureFormData>();
  const screens = watch("screens");
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 items-start w-full gap-4 overflow-auto">
      {screens.map((screen) => (
        <div
          className="flex flex-col bg-neutral-100 dark:bg-neutral-900 rounded-xl"
          key={`${screen.id}`}
        >
          <Image
            className="z-0 object-cover w-full h-auto rounded-lg"
            src={screen.url}
            alt={`Extracted frame at ${screen.timestamp}`}
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
