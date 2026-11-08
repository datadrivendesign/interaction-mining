"use client";

import Image from "next/image";
import { useState } from "react";
import type { ScreenGesture } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FrameData, Redaction } from "../../../edit/components/types";
import { ScreenOverlays } from "./review-screen-card";
import { ScreenDescription } from "./screen-description";

/**
 * One screen at full height, so the reviewer can read its text and check
 * privacy. Left and right arrows step through the screens.
 */
export function ScreenEnlargeDialog({
  sortedScreens,
  openIndex,
  onIndexChange,
  onClose,
  gestures,
  redactions,
}: {
  sortedScreens: FrameData[];
  /** Index into sortedScreens, or null when closed. */
  openIndex: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  gestures: Record<string, ScreenGesture | undefined>;
  redactions: Record<string, Redaction[] | undefined>;
}) {
  const [seeUnderBoxes, setSeeUnderBoxes] = useState(false);
  const screen = openIndex !== null ? sortedScreens[openIndex] : undefined;
  const canPrev = openIndex !== null && openIndex > 0;
  const canNext = openIndex !== null && openIndex < sortedScreens.length - 1;
  const screenRedactions = screen ? (redactions[screen.id] ?? []) : [];

  return (
    <Dialog open={!!screen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex max-h-[calc(100vh-2rem)] w-auto max-w-[calc(100vw-2rem)] flex-col gap-3 p-4"
        onKeyDown={(event) => {
          // Keep page hotkeys (Space, R, 1-9, verdict keys) from acting on
          // the page behind the dialog. Escape still closes it.
          if (event.key !== "Escape") event.stopPropagation();
          if (openIndex === null) return;
          if (event.key === "ArrowLeft" && canPrev) {
            event.preventDefault();
            onIndexChange(openIndex - 1);
          } else if (event.key === "ArrowRight" && canNext) {
            event.preventDefault();
            onIndexChange(openIndex + 1);
          }
        }}
      >
        {screen && openIndex !== null && (
          <>
            <div className="flex items-center gap-2 pr-8">
              <DialogTitle className="text-base">
                Screen {openIndex + 1} of {sortedScreens.length}
              </DialogTitle>
              <DialogDescription className="sr-only">
                The screen at full size. Use the left and right arrow keys to
                move between screens.
              </DialogDescription>
              {screenRedactions.length > 0 && (
                <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-neutral-600 select-none dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={seeUnderBoxes}
                    onChange={(event) => setSeeUnderBoxes(event.target.checked)}
                  />
                  See under boxes
                </label>
              )}
            </div>

            <div className="flex min-h-0 items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous screen"
                disabled={!canPrev}
                onClick={() => onIndexChange(openIndex - 1)}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <div className="relative">
                <Image
                  key={screen.id}
                  src={screen.src}
                  alt={`Screen ${openIndex + 1}`}
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="block h-auto max-h-[calc(100vh-12rem)] w-auto max-w-[calc(100vw-10rem)] rounded-lg border border-neutral-300 dark:border-neutral-700"
                />
                <ScreenOverlays
                  screenId={`enlarged-${screen.id}`}
                  gesture={gestures[screen.id]}
                  redactions={screenRedactions}
                  translucentRedactions={seeUnderBoxes}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next screen"
                disabled={!canNext}
                onClick={() => onIndexChange(openIndex + 1)}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>

            <ScreenDescription
              gesture={gestures[screen.id]}
              isLastScreen={openIndex === sortedScreens.length - 1}
              className="mx-auto max-w-prose text-center text-sm leading-relaxed"
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
