"use client";

import Image from "next/image";
import { ReactNode, useMemo } from "react";
import { cn } from "@/lib/utils";
import { FrameData, TraceFormData } from "../../../edit/components/types";
import { ScreenComment } from "../shared/screen-comments-panel";
import { ReviewScreenCard } from "../shared/review-screen-card";
import { ReviewGalleryGrid } from "../shared/review-gallery-grid";

export function ReviewGalleryAndroid({
  traceData,
  activeScreenId,
  commentsByScreen,
  onScreenSelect,
  captureTimestamp,
  selectedScreenIds,
  onSelectedScreenToggle,
  fixedScreenIds,
  renderCardFooter,
  banner,
  onOpenScreen,
}: {
  traceData: TraceFormData;
  activeScreenId: string | null;
  commentsByScreen: Record<string, ScreenComment[]>;
  onScreenSelect: (id: string) => void;
  captureTimestamp?: string | null;
  selectedScreenIds?: string[];
  onSelectedScreenToggle?: (screenId: string, checked: boolean) => void;
  /** Screens fixed on this page; they get a "Fixed" badge. */
  fixedScreenIds?: string[];
  /** Controls under a card's description (the Fix button). */
  renderCardFooter?: (screenId: string, index: number) => ReactNode;
  /** Shown above the screens (the "Fixes saved" list). */
  banner?: ReactNode;
  /** Opens the screen viewer (double-click or the enlarge button). */
  onOpenScreen?: (screenId: string) => void;
}) {
  const sortedScreens = useMemo(
    () => [...traceData.screens].sort((a, b) => a.timestamp - b.timestamp),
    [traceData.screens],
  );
  const screensWithIssues = sortedScreens.filter(
    (screen) => (commentsByScreen[screen.id]?.length ?? 0) > 0,
  ).length;

  // No gap callouts: Android timestamps are clock times between saved
  // frames, not positions in one video.
  return (
    <ReviewGalleryGrid
      sortedScreens={sortedScreens}
      activeScreenId={activeScreenId}
      screensWithIssues={screensWithIssues}
      captureTimestamp={captureTimestamp}
      banner={banner}
      renderCard={(screen, index, cardRef, cardSize) => (
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
          size={cardSize}
          onEnlarge={onOpenScreen ? () => onOpenScreen(screen.id) : undefined}
          isFixed={fixedScreenIds?.includes(screen.id) ?? false}
          onSelect={() => onScreenSelect(screen.id)}
          isSelected={selectedScreenIds?.includes(screen.id) ?? false}
          onSelectedToggle={
            onSelectedScreenToggle
              ? (checked) => onSelectedScreenToggle(screen.id, checked)
              : undefined
          }
          footer={renderCardFooter?.(screen.id, index)}
          renderImage={(borderClass) =>
            screen.src.length > 0 ? (
              <ImageWithVH
                screen={screen}
                vh={traceData.vhs?.[screen.id]}
                borderClass={borderClass}
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

const ImageWithVH = ({
  screen,
  vh,
  borderClass,
}: {
  screen: FrameData;
  vh: any;
  borderClass: string;
}) => {
  const { boxes, rootBounds } = useMemo(() => {
    if (!vh) return { boxes: [], rootBounds: null };

    const boxes: any[] = [];
    let rootBounds: any = null;

    function traverse(node: any) {
      if (node.bounds_in_screen) {
        const [left, top, right, bottom] = node.bounds_in_screen
          .split(" ")
          .map(Number);
        const width = right - left;
        const height = bottom - top;
        const x = left;
        const y = top;
        if (!rootBounds) {
          rootBounds = { x, y, width, height };
        }
        if (width <= 0 || height <= 0) {
          return;
        }
        boxes.push({
          x,
          y,
          width,
          height,
          class: node.class_name,
          id: node.id || "null_id",
        });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => traverse(child));
      }
    }
    traverse(vh);
    return { boxes, rootBounds };
  }, [vh]);

  return (
    <div className="relative w-full">
      <Image
        className={cn(
          "relative z-0 h-auto w-full rounded-lg border-2 object-contain transition-all duration-150",
          borderClass,
        )}
        src={screen.src}
        alt={screen.id}
        width={0}
        height={0}
        sizes="640px"
      />
      {rootBounds && (
        <svg
          viewBox={`${rootBounds.x} ${rootBounds.y} ${rootBounds.width} ${rootBounds.height}`}
          preserveAspectRatio="xMinYMin meet"
          className="pointer-events-none absolute top-0 left-0 h-full w-full"
        >
          {boxes.map((box: any, index: number) => (
            <rect
              key={box.id + index}
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              fill={"transparent"}
              stroke="red"
              strokeWidth="1"
            />
          ))}
        </svg>
      )}
    </div>
  );
};
