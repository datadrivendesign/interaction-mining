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

export interface RedactScreenJumpTarget {
  nonce: number;
  screenId: string;
}

export default function RedactScreen({
  jumpTarget,
}: {
  jumpTarget?: RedactScreenJumpTarget | null;
}) {
  const { getValues } = useFormContext<TraceFormData>();
  const screens = getValues("screens") as FrameData[];
  const vhs = getValues("vhs") as { [key: string]: any };
  const [watchRedactions] = useWatch({
    name: ["redactions"],
  });
  const redactions = watchRedactions || {};

  const [focusViewIndex, setFocusViewIndex] = useState<number>(-1);
  const [copied, setCopied] = useState<Redaction[]>([]);

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

  React.useEffect(() => {
    if (!jumpTarget) {
      return;
    }

    const targetIndex = screens.findIndex(
      (screen) => screen.id === jumpTarget.screenId,
    );
    if (targetIndex >= 0) {
      setFocusViewIndex(targetIndex);
    }
  }, [jumpTarget, screens]);

  return (
    <div className="flex h-full w-full min-w-0 overflow-hidden">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel
          defaultSize={75}
          className="relative z-20 min-w-0 overflow-hidden"
        >
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
        <ResizablePanel
          defaultSize={20}
          minSize={20}
          maxSize={50}
          className="relative z-10 min-w-0"
        >
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
