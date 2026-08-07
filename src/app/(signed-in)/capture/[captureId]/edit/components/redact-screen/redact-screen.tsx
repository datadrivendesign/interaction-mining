"use client";
import React, { useCallback, useRef, useState } from "react";
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

type NavigationReadiness = {
  isBlockingNavigation: boolean;
  reason?: string;
};

export default function RedactScreen({
  jumpTarget,
  onNavigationReadinessChange,
}: {
  jumpTarget?: RedactScreenJumpTarget | null;
  onNavigationReadinessChange?: (readiness: NavigationReadiness) => void;
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
  const focusedScreen =
    focusViewIndex > -1 ? screens[focusViewIndex] : undefined;
  const focusedScreenId = focusedScreen?.id ?? null;
  const focusedScreenSrc = focusedScreen?.src ?? "";

  React.useEffect(() => {
    if (focusViewIndex < 0) {
      onNavigationReadinessChange?.({ isBlockingNavigation: false });
      return;
    }

    if (!focusedScreenSrc) {
      onNavigationReadinessChange?.({
        isBlockingNavigation: true,
        reason: "Selected redaction screen image is still loading...",
      });
      return;
    }

    onNavigationReadinessChange?.({
      isBlockingNavigation: true,
      reason: "Loading selected redaction screen image...",
    });
  }, [
    focusViewIndex,
    focusedScreenId,
    focusedScreenSrc,
    onNavigationReadinessChange,
  ]);

  const handleImageStatusChange = useCallback(
    (imageStatus: "loading" | "loaded" | "failed") => {
      if (imageStatus === "loading") {
        onNavigationReadinessChange?.({
          isBlockingNavigation: true,
          reason: "Loading selected redaction screen image...",
        });
        return;
      }
      if (imageStatus === "failed") {
        onNavigationReadinessChange?.({
          isBlockingNavigation: true,
          reason:
            "Selected redaction screen image failed to load. Refresh or return to upload.",
        });
        return;
      }
      onNavigationReadinessChange?.({
        isBlockingNavigation: false,
      });
    },
    [onNavigationReadinessChange],
  );

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

  // Apply each checklist jump exactly once. `screens` is read via `getValues`
  // here, so it happens to keep a stable identity and this effect does not
  // currently re-fire on form writes — unlike the repair step, where the same
  // effect without this guard re-applied the jump on every keystroke. Guarding
  // anyway so the behaviour does not depend on that accident.
  const appliedJumpNonceRef = useRef<number | null>(null);

  React.useEffect(() => {
    if (!jumpTarget) {
      return;
    }
    if (appliedJumpNonceRef.current === jumpTarget.nonce) {
      return;
    }

    const targetIndex = screens.findIndex(
      (screen) => screen.id === jumpTarget.screenId,
    );
    if (targetIndex >= 0) {
      appliedJumpNonceRef.current = jumpTarget.nonce;
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
          {focusedScreen ? (
            <FocusView
              key={focusedScreen.id}
              screen={focusedScreen}
              vh={vhs[focusedScreen.id]}
              copied={copied}
              setCopied={setCopied}
              onImageStatusChange={handleImageStatusChange}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-3xl font-semibold text-muted-foreground lg:text-4xl">
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
