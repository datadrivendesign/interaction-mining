"use client";

import Image from "next/image";
import { ReactNode, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TraceFormData } from "../../../edit/components/types";
import { ScreenComment } from "../shared/screen-comments-panel";
import { ReviewScreenCard } from "../shared/review-screen-card";
import {
  findScreenGaps,
  GAP_CALLOUT_SECONDS,
  ReviewGalleryGrid,
} from "../shared/review-gallery-grid";

export function ReviewGalleryIOS({
  traceData,
  activeScreenId,
  commentsByScreen,
  onScreenSelect,
  captureTimestamp,
  selectedScreenIds,
  onSelectedScreenToggle,
  fixedScreenIds,
  renderCardFooter,
}: {
  traceData: TraceFormData;
  activeScreenId: string | null;
  commentsByScreen: Record<string, ScreenComment[]>;
  onScreenSelect: (id: string, timestamp: number) => void;
  captureTimestamp?: string | null;
  selectedScreenIds?: string[];
  onSelectedScreenToggle?: (screenId: string, checked: boolean) => void;
  /** Screens fixed on this page; they get a "Fixed" badge. */
  fixedScreenIds?: string[];
  /** Controls under a card's description (the Fix button). */
  renderCardFooter?: (screenId: string, index: number) => ReactNode;
}) {
  const [orientationByScreenId, setOrientationByScreenId] = useState<
    Record<string, "portrait" | "landscape">
  >({});
  const sortedScreens = useMemo(
    () => [...traceData.screens].sort((a, b) => a.timestamp - b.timestamp),
    [traceData.screens],
  );
  // iOS timestamps are seconds into the recording, so gaps are meaningful.
  const gapsByScreenId = useMemo(
    () => findScreenGaps(sortedScreens, GAP_CALLOUT_SECONDS),
    [sortedScreens],
  );
  const screensWithIssues = sortedScreens.filter(
    (screen) => (commentsByScreen[screen.id]?.length ?? 0) > 0,
  ).length;

  return (
    <ReviewGalleryGrid
      sortedScreens={sortedScreens}
      activeScreenId={activeScreenId}
      screensWithIssues={screensWithIssues}
      captureTimestamp={captureTimestamp}
      gapsByScreenId={gapsByScreenId}
      renderCard={(screen, index, cardRef) => (
        <ReviewScreenCard
          key={screen.id}
          cardRef={cardRef}
          index={index}
          screenId={screen.id}
          gesture={traceData.gestures[screen.id]}
          redactions={traceData.redactions[screen.id] || []}
          isActive={screen.id === activeScreenId}
          isLastScreen={index === sortedScreens.length - 1}
          issueCount={commentsByScreen[screen.id]?.length ?? 0}
          isLandscape={orientationByScreenId[screen.id] === "landscape"}
          isFixed={fixedScreenIds?.includes(screen.id) ?? false}
          onSelect={() => onScreenSelect(screen.id, screen.timestamp)}
          isSelected={selectedScreenIds?.includes(screen.id) ?? false}
          onSelectedToggle={
            onSelectedScreenToggle
              ? (checked) => onSelectedScreenToggle(screen.id, checked)
              : undefined
          }
          footer={renderCardFooter?.(screen.id, index)}
          renderImage={(borderClass) =>
            screen.src.length > 0 ? (
              <Image
                src={screen.src}
                alt={`Screen ${index + 1}`}
                width={0}
                height={0}
                sizes="320px"
                className={cn(
                  "relative z-0 h-auto w-full rounded-lg border-2 object-contain transition-all duration-150",
                  borderClass,
                )}
                onLoad={(event) => {
                  const img = event.currentTarget;
                  if (!img.naturalWidth || !img.naturalHeight) return;
                  const orientation =
                    img.naturalWidth > img.naturalHeight
                      ? "landscape"
                      : "portrait";
                  setOrientationByScreenId((prev) =>
                    prev[screen.id] === orientation
                      ? prev
                      : { ...prev, [screen.id]: orientation },
                  );
                }}
              />
            ) : (
              <div
                className={cn(
                  "aspect-[9/19] w-full rounded-lg border-2 bg-neutral-100 transition-all duration-150 dark:bg-neutral-800",
                  borderClass,
                )}
              />
            )
          }
        />
      )}
    />
  );
}
