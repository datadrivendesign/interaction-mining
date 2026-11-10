"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { ScreenGesture } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Redaction, TraceFormData } from "../../types";
import { ReviewScreenCard } from "../../../../evaluate/components/shared/review-screen-card";
import {
  findScreenGaps,
  GAP_CALLOUT_SECONDS,
  ReviewGalleryGrid,
} from "../../../../evaluate/components/shared/review-gallery-grid";
import { ScreenViewerDialog } from "../../../../evaluate/components/shared/screen-viewer-dialog";

const noChange = async () => false;

/**
 * The worker's last look before Finish: every screen in the same wrapped,
 * numbered grid the reviewer sees. Clicking a screen opens it at full size
 * (look only), so small private text can be checked.
 */
export function SaveTraceGallery({ os }: { os: string }) {
  const { watch } = useFormContext<TraceFormData>();
  const screens = watch("screens");
  const gestures = watch("gestures") as { [key: string]: ScreenGesture };
  const redactions = watch("redactions") as { [key: string]: Redaction[] };
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [openScreenId, setOpenScreenId] = useState<string | null>(null);
  const [orientationByScreenId, setOrientationByScreenId] = useState<
    Record<string, "portrait" | "landscape">
  >({});

  const sortedScreens = useMemo(
    () => [...screens].sort((a, b) => a.timestamp - b.timestamp),
    [screens],
  );
  // iOS timestamps are seconds into the recording, so gaps mean something.
  const gapsByScreenId = useMemo(
    () =>
      os === "ios" ? findScreenGaps(sortedScreens, GAP_CALLOUT_SECONDS) : {},
    [os, sortedScreens],
  );

  const openIndex = sortedScreens.findIndex(
    (screen) => screen.id === openScreenId,
  );
  const openScreen = openIndex >= 0 ? sortedScreens[openIndex] : null;
  const openViewer = (screenId: string) => {
    setActiveScreenId(screenId);
    setOpenScreenId(screenId);
  };

  return (
    <>
      <ReviewGalleryGrid
        sortedScreens={sortedScreens}
        activeScreenId={activeScreenId}
        screensWithIssues={0}
        gapsByScreenId={gapsByScreenId}
        renderCard={(screen, index, cardRef, cardSize) => (
          <ReviewScreenCard
            key={screen.id}
            cardRef={cardRef}
            index={index}
            screenId={screen.id}
            gesture={gestures[screen.id]}
            redactions={redactions[screen.id] || []}
            isActive={screen.id === activeScreenId}
            isLastScreen={index === sortedScreens.length - 1}
            issueCount={0}
            isLandscape={orientationByScreenId[screen.id] === "landscape"}
            size={cardSize}
            onSelect={() => openViewer(screen.id)}
            onEnlarge={() => openViewer(screen.id)}
            renderImage={(borderClass) =>
              screen.src.length > 0 ? (
                <Image
                  src={screen.src}
                  alt={`Screen ${index + 1}`}
                  width={0}
                  height={0}
                  sizes="640px"
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
                    "aspect-[9/19] w-full rounded-lg border-2 bg-neutral-100 dark:bg-neutral-800",
                    borderClass,
                  )}
                />
              )
            }
          />
        )}
      />
      <ScreenViewerDialog
        target={
          openScreen && openScreen.src
            ? { screen: openScreen, isNew: false, tab: "view" }
            : null
        }
        canEdit={false}
        screenNumber={openIndex + 1}
        screenCount={sortedScreens.length}
        isLastScreen={openIndex === sortedScreens.length - 1}
        gesture={openScreen ? gestures[openScreen.id] : undefined}
        redactions={openScreen ? (redactions[openScreen.id] ?? []) : []}
        noteCount={0}
        previousScreenId={sortedScreens[openIndex - 1]?.id ?? null}
        nextScreenId={
          openIndex >= 0 ? (sortedScreens[openIndex + 1]?.id ?? null) : null
        }
        onNavigate={(screenId) => openViewer(screenId)}
        isSaving={false}
        onSave={noChange}
        onRemove={noChange}
        onClose={() => setOpenScreenId(null)}
      />
    </>
  );
}
