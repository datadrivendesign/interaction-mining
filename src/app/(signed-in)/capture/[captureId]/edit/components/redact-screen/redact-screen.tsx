"use client";
import React, { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { Redaction } from "../types";
import { useFormContext, useWatch } from "react-hook-form";
import { TraceFormData } from "../types";
import { FrameData } from "../types";
import { Filmstrip } from "./components/filmstrip";
import { FocusView } from "./components/focus-view";

export default function RedactScreen() {
  const { getValues } = useFormContext<TraceFormData>();
  const screens = getValues("screens") as FrameData[];
  const vhs = getValues("vhs") as { [key: string]: any };
  const [watchRedactions] = useWatch({
    name: ["redactions"],
  });
  const redactions = watchRedactions || {};

  const [focusViewIndex, setFocusViewIndex] = useState<number>(-1);
  const [copied, setCopied] = useState<Redaction | null>(null);

  const handlePrevious = useCallback(() => {
    const wrappedIndex = (focusViewIndex - 1 + screens.length) % screens.length;
    setFocusViewIndex(wrappedIndex);
  }, [focusViewIndex, screens.length]);

  const handleNext = useCallback(() => {
    const wrappedIndex = (focusViewIndex + 1) % screens.length;
    setFocusViewIndex(wrappedIndex);
  }, [focusViewIndex, screens.length]);

  useHotkeys("left", handlePrevious);
  useHotkeys("right", handleNext);
  useHotkeys("tab", handleNext);

  return (
    <div className="flex w-full h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={75}>
          {focusViewIndex > -1 ? (
            <FocusView
              key={focusViewIndex}
              screen={screens[focusViewIndex]}
              vh={vhs[screens[focusViewIndex].id]}
              copied={copied}
              setCopied={setCopied}
            />
          ) : (
            <div className="flex justify-center items-center w-full h-full">
              <span className="text-3xl lg:text-4xl text-muted-foreground font-semibold">
                Select a screen from the filmstrip.
              </span>
            </div>
          )}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={20} minSize={20} maxSize={50}>
          <Filmstrip
            screens={screens}
            redactions={redactions}
            focusViewIndex={focusViewIndex}
            setFocusViewIndex={setFocusViewIndex}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
