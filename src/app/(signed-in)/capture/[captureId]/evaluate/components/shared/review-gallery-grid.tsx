"use client";

import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FrameData } from "../../../edit/components/types";
import {
  DEFAULT_SCREEN_CARD_SIZE,
  SCREEN_CARD_SIZES,
  ScreenCardSize,
} from "./review-screen-card";
import { ScreenDescriptionLegend } from "./screen-description";

const CARD_SIZE_STORAGE_KEY = "review-gallery-card-size";

function readStoredCardSize(): ScreenCardSize {
  try {
    const stored = window.localStorage.getItem(CARD_SIZE_STORAGE_KEY);
    return (
      SCREEN_CARD_SIZES.find((size) => size === stored) ??
      DEFAULT_SCREEN_CARD_SIZE
    );
  } catch {
    return DEFAULT_SCREEN_CARD_SIZE;
  }
}

/** Seconds between two screens that suggest a missing screen (iOS video). */
export const GAP_CALLOUT_SECONDS = 6;

/**
 * Screens whose gap from the previous screen is over the threshold, keyed by
 * screen id. Only meaningful when timestamps are seconds into one video.
 */
export function findScreenGaps(
  sortedScreens: FrameData[],
  thresholdSeconds: number,
): Record<string, number> {
  const gaps: Record<string, number> = {};
  for (let i = 1; i < sortedScreens.length; i++) {
    const gap = sortedScreens[i].timestamp - sortedScreens[i - 1].timestamp;
    if (gap > thresholdSeconds) gaps[sortedScreens[i].id] = gap;
  }
  return gaps;
}

/**
 * The review gallery: every screen in numbered rows that wrap, so the whole
 * trace is visible without sideways scrolling. A callout sits between two
 * screens far apart in the video.
 */
export function ReviewGalleryGrid({
  sortedScreens,
  activeScreenId,
  screensWithIssues,
  captureTimestamp,
  gapsByScreenId = {},
  banner,
  renderCard,
}: {
  sortedScreens: FrameData[];
  activeScreenId: string | null;
  screensWithIssues: number;
  captureTimestamp?: string | null;
  /** From `findScreenGaps`; leave empty where timestamps are not video time. */
  gapsByScreenId?: Record<string, number>;
  /** Shown above the screens (the "Fixes saved" list). */
  banner?: ReactNode;
  renderCard: (
    screen: FrameData,
    index: number,
    cardRef: (node: HTMLElement | null) => void,
    cardSize: ScreenCardSize,
  ) => ReactNode;
}) {
  const [cardSize, setCardSize] = useState<ScreenCardSize>(
    DEFAULT_SCREEN_CARD_SIZE,
  );
  // Read after mount so the server render and first client render match.
  useEffect(() => setCardSize(readStoredCardSize()), []);
  const changeCardSize = (size: ScreenCardSize) => {
    setCardSize(size);
    try {
      window.localStorage.setItem(CARD_SIZE_STORAGE_KEY, size);
    } catch {
      // Storage blocked: the size still applies for this visit.
    }
  };
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  // Keep the active screen in view as the reviewer steps through screens.
  useEffect(() => {
    if (!activeScreenId) return;
    const container = scrollContainerRef.current;
    const card = cardRefs.current[activeScreenId];
    if (!container || !card) return;
    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const isVisible =
      cardRect.top >= containerRect.top &&
      cardRect.bottom <= containerRect.bottom;
    if (!isVisible) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeScreenId]);

  return (
    <section className="flex h-full w-full flex-col">
      <div className="flex h-9 flex-shrink-0 items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-4 dark:border-neutral-800 dark:bg-neutral-950">
        <span className="shrink-0 text-[10px] font-medium tracking-widest text-neutral-400 uppercase dark:text-neutral-600">
          Gallery
        </span>
        <p className="min-w-0 flex-1 truncate text-xs text-neutral-600 dark:text-neutral-400">
          {sortedScreens.length} screen{sortedScreens.length === 1 ? "" : "s"}
          {screensWithIssues > 0 ? ` • ${screensWithIssues} flagged` : ""}
          {captureTimestamp ? ` • Created ${captureTimestamp}` : ""}
        </p>
        <ScreenDescriptionLegend />
        <div
          role="group"
          aria-label="Screen size"
          className="flex shrink-0 overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700"
        >
          {SCREEN_CARD_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={cardSize === size}
              title={`${size === "S" ? "Small" : size === "M" ? "Medium" : "Large"} screens`}
              onClick={() => changeCardSize(size)}
              className={cn(
                "cursor-pointer px-2 py-0.5 text-[11px] font-semibold transition-colors",
                cardSize === size
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-white text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6"
      >
        {banner}
        <div className="flex flex-wrap items-start gap-x-3 gap-y-5">
          {sortedScreens.map((screen, index) => {
            const gap = gapsByScreenId[screen.id];
            return (
              <Fragment key={screen.id}>
                {gap !== undefined && (
                  <GapCallout seconds={gap} afterScreen={index} />
                )}
                {renderCard(
                  screen,
                  index,
                  (node) => {
                    cardRefs.current[screen.id] = node;
                  },
                  cardSize,
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GapCallout({
  seconds,
  afterScreen,
}: {
  seconds: number;
  afterScreen: number;
}) {
  return (
    <div className="flex w-24 shrink-0 items-center self-stretch">
      <div className="w-full rounded-lg border border-dashed border-amber-500 bg-amber-50 px-2 py-2 text-center text-[11px] leading-snug text-amber-800 dark:border-amber-500/70 dark:bg-amber-950/40 dark:text-amber-200">
        <span className="block text-sm font-bold">
          {Math.round(seconds)} s gap
        </span>
        between screens {afterScreen} and {afterScreen + 1}.
        <span className="block">Check for a missing screen.</span>
      </div>
    </div>
  );
}
