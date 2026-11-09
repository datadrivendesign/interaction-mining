"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Capture } from "@prisma/client";
import { useHotkeys } from "react-hotkeys-hook";
import { FrameData, TraceFormData } from "../../../edit/components/types";
import { InteractionSummaryEditor } from "./interaction-summary-editor";
import { FixScreenButton } from "./screen-fix-controls";
import { ScreenViewerDialog } from "./screen-viewer-dialog";
import { FixTab, useScreenFixes } from "./use-screen-fixes";
import type { VerdictMode } from "./verdict-mode";

/**
 * The review page's fix wiring, the same on iOS and Android: the screen
 * viewer, the Fix button under each card, the F hotkey, and the editable
 * Interaction Summary. The page places the returned pieces.
 */
export function useReviewScreenFixes({
  capture,
  traceData,
  setTraceData,
  draftVersion,
  setDraftVersion,
  verdictMode,
  isSubmitting,
  activeScreenId,
  setActiveScreenId,
  setGallerySelectedScreenIds,
  noteCountByScreen,
  onViewerNavigate,
  showTimeLabel = false,
  summaryTextClassName,
}: {
  capture?: Capture | null;
  traceData?: TraceFormData;
  setTraceData: Dispatch<SetStateAction<TraceFormData | undefined>>;
  draftVersion: string | null;
  setDraftVersion: (version: string) => void;
  verdictMode: VerdictMode;
  isSubmitting: boolean;
  activeScreenId: string | null;
  setActiveScreenId: Dispatch<SetStateAction<string | null>>;
  setGallerySelectedScreenIds: Dispatch<SetStateAction<string[]>>;
  noteCountByScreen: Record<string, unknown[] | undefined>;
  /** Selects the screen on the page when the viewer moves to it. */
  onViewerNavigate: (screen: FrameData) => void;
  /** Shows the screen's video time in the viewer title (iOS). */
  showTimeLabel?: boolean;
  summaryTextClassName?: string;
}) {
  // Staff fix screens in place; every saved fix is a new draft.
  const canFix = verdictMode !== "none";
  const canEdit = canFix && !isSubmitting;
  const fixes = useScreenFixes({
    capture,
    traceData,
    setTraceData,
    draftVersion,
    setDraftVersion,
    onScreenRemoved: (removedId) => {
      // Move to a neighbouring screen and drop the removed one from the
      // note composer's selection.
      const screens = traceData?.screens ?? [];
      const index = screens.findIndex((screen) => screen.id === removedId);
      const neighbour = screens[index + 1] ?? screens[index - 1];
      setActiveScreenId((prev) =>
        prev === removedId ? (neighbour?.id ?? null) : prev,
      );
      setGallerySelectedScreenIds((prev) =>
        prev.filter((id) => id !== removedId),
      );
    },
  });

  const screens = traceData?.screens ?? [];
  const hasImage = (screenId: string | null) =>
    !!screens.find((screen) => screen.id === screenId)?.src;

  // The open screen's place in the trace; a new screen is counted where it
  // will land by time.
  const target = fixes.fixTarget;
  const fixScreen = target?.screen;
  const screensAfter = target?.isNew
    ? [...screens, target.screen].sort((a, b) => a.timestamp - b.timestamp)
    : screens;
  const screenIndex = fixScreen
    ? screensAfter.findIndex((screen) => screen.id === fixScreen.id)
    : -1;
  const screenNumber = screenIndex + 1;
  // Arrows step through the trace's screens; a new screen has none.
  const previousScreenId =
    fixScreen && !target?.isNew ? (screens[screenIndex - 1]?.id ?? null) : null;
  const nextScreenId =
    fixScreen && !target?.isNew ? (screens[screenIndex + 1]?.id ?? null) : null;

  const handleViewerNavigate = (screenId: string, mode: FixTab) => {
    fixes.openFix(screenId, mode);
    const screen = screens.find((s) => s.id === screenId);
    if (screen) onViewerNavigate(screen);
  };

  // F: fix the active screen (staff, once its image has loaded).
  useHotkeys(
    "f",
    (event) => {
      event.preventDefault();
      if (activeScreenId) fixes.openFix(activeScreenId, "gesture");
    },
    {
      enabled: canEdit && !fixes.fixTarget && hasImage(activeScreenId),
    },
    [activeScreenId, fixes.openFix],
  );

  const summaryBlock: ReactNode = traceData ? (
    <InteractionSummaryEditor
      summary={traceData.description}
      canEdit={canEdit}
      isSaving={fixes.isSaving}
      onSave={fixes.saveTaskDescription}
      textClassName={summaryTextClassName}
    />
  ) : null;

  /** Props for the review gallery. */
  const galleryProps = {
    fixedScreenIds: fixes.fixedScreenIds,
    onOpenScreen: (screenId: string) => fixes.openFix(screenId, "view"),
    renderCardFooter: canFix
      ? (screenId: string, index: number) => (
          <FixScreenButton
            screenNumber={index + 1}
            disabled={isSubmitting || fixes.isSaving || !hasImage(screenId)}
            onClick={() => fixes.openFix(screenId, "gesture")}
          />
        )
      : undefined,
  };

  const viewerDialog = (
    <ScreenViewerDialog
      target={target}
      canEdit={canEdit}
      previousScreenId={previousScreenId}
      nextScreenId={nextScreenId}
      onNavigate={handleViewerNavigate}
      screenNumber={screenNumber}
      screenCount={screensAfter.length}
      isLastScreen={screenNumber === screensAfter.length}
      timeLabel={
        showTimeLabel && fixScreen
          ? `${fixScreen.timestamp.toFixed(1)} s`
          : undefined
      }
      gesture={fixScreen ? traceData?.gestures[fixScreen.id] : undefined}
      redactions={fixScreen ? (traceData?.redactions[fixScreen.id] ?? []) : []}
      noteCount={fixScreen ? (noteCountByScreen[fixScreen.id]?.length ?? 0) : 0}
      isSaving={fixes.isSaving}
      onSave={fixes.saveScreen}
      onRemove={fixes.removeScreen}
      onClose={fixes.closeFix}
    />
  );

  /** Extra rows for the verdict bar's shortcut list. */
  const shortcuts = canFix ? [{ label: "Fix screen", keys: "F" }] : [];

  return {
    fixes,
    canFix,
    summaryBlock,
    galleryProps,
    viewerDialog,
    shortcuts,
  };
}
