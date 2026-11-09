"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useParams } from "next/navigation";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DraftTraceFormData,
  TraceFormData,
} from "../../../edit/components/types";
import { useCapture } from "@/lib/hooks/capture";
import { ReviewVideoPanelIOS } from "./review-video-panel-ios";
import { ReviewGalleryIOS } from "./review-gallery-ios";
import { getDraftFiles } from "../../../edit/util";
import { getSignedCaptureFileUrl } from "@/lib/actions";
import { ScreenCommentsPanel } from "../shared/screen-comments-panel";
import { VerdictBar } from "../shared/verdict-bar";
import {
  EMPTY_REVIEW_FEEDBACK_STATE,
  hydrateReviewFeedbackState,
  ReviewFeedbackState,
} from "../../utils/review-feedback";
import { getReviewIssueSummary } from "../shared/review-issue-summary";
import { useReviewCommentHotkeys } from "../shared/use-review-comment-hotkeys";
import { useReviewVerdictActions } from "../shared/use-review-verdict-actions";
import { getVerdictMode, taskListPathFor } from "../shared/verdict-mode";
import {
  getChecklistStatus,
  passUnflaggedSteps,
  ReviewChecklist,
} from "../shared/review-checklist";
import { PublishProgressDialog } from "../shared/publish-progress-dialog";
import { draftVersionFromKey } from "@/lib/aws/s3/upload-purpose";
import { useIOSReviewPlayback } from "./use-ios-review-playback";
import { formatCaptureTimestampFromObjectId } from "@/lib/utils/capture-timestamp";
import { toast } from "sonner";
import { extractVideoFrame } from "../../../edit/components/repair-screen/util/ios-video-operations";
import { useScreenFixes } from "../shared/use-screen-fixes";
import { ScreenViewerDialog } from "../shared/screen-viewer-dialog";
import type { FixTab } from "../shared/use-screen-fixes";
import { useHotkeys } from "react-hotkeys-hook";
import { InteractionSummaryEditor } from "../shared/interaction-summary-editor";
import { FixScreenButton } from "../shared/screen-fix-controls";

/** A new screen this close (seconds) to an existing one is a duplicate. */
const DUPLICATE_SCREEN_SECONDS = 0.05;

const REVIEW_VIDEO_PANEL_DEFAULT_HORIZONTAL = 23;
const REVIEW_VIDEO_PANEL_LANDSCAPE_HORIZONTAL = 31;
const REVIEW_VIDEO_PANEL_DEFAULT_COMPACT = 35;
const REVIEW_VIDEO_PANEL_LANDSCAPE_COMPACT = 44;

export function EvaluationClientIOS({
  isAdmin,
  isReviewer,
}: {
  isAdmin: boolean;
  isReviewer: boolean;
}) {
  const params = useParams();
  const captureId = params.captureId as string;
  const [traceData, setTraceData] = useState<TraceFormData>();
  // Draft the page loaded (`draft-<ms>`); a reviewer approves exactly this one.
  const [draftVersion, setDraftVersion] = useState<string | null>(null);
  const [hasNoDraft, setHasNoDraft] = useState(false);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<ReviewFeedbackState>(
    EMPTY_REVIEW_FEEDBACK_STATE,
  );
  // The reviewer's Pass/Issue mark per step; it gates the verdict.
  const [checklist, setChecklist] = useState<ReviewChecklist>({});
  useEffect(() => {
    setChecklist({});
  }, [captureId]);
  const [gallerySelectedScreenIds, setGallerySelectedScreenIds] = useState<
    string[]
  >([]);
  const [isComposerInScreenMode, setIsComposerInScreenMode] = useState(false);

  const handleGalleryToggle = useCallback(
    (screenId: string, checked: boolean) => {
      setGallerySelectedScreenIds((prev) =>
        checked
          ? prev.includes(screenId)
            ? prev
            : [...prev, screenId]
          : prev.filter((id) => id !== screenId),
      );
    },
    [],
  );
  const [hasHydratedFeedback, setHasHydratedFeedback] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [reviewVideoLandscape, setReviewVideoLandscape] = useState<
    boolean | null
  >(null);
  const reviewVideoPanelRef = useRef<ImperativePanelHandle>(null);
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });
  const captureDbId = capture?.id ?? null;
  const captureTimestamp = captureDbId
    ? formatCaptureTimestampFromObjectId(captureDbId)
    : null;

  useEffect(() => {
    const updateLayoutMode = () => {
      setIsCompactLayout(window.innerWidth < 1024);
    };
    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);
    return () => {
      window.removeEventListener("resize", updateLayoutMode);
    };
  }, []);

  useEffect(() => {
    setReviewVideoLandscape(null);
  }, [captureId]);

  useEffect(() => {
    if (reviewVideoLandscape === null) {
      return;
    }
    const panel = reviewVideoPanelRef.current;
    if (!panel) {
      return;
    }
    if (isCompactLayout) {
      panel.resize(
        reviewVideoLandscape
          ? REVIEW_VIDEO_PANEL_LANDSCAPE_COMPACT
          : REVIEW_VIDEO_PANEL_DEFAULT_COMPACT,
      );
    } else {
      panel.resize(
        reviewVideoLandscape
          ? REVIEW_VIDEO_PANEL_LANDSCAPE_HORIZONTAL
          : REVIEW_VIDEO_PANEL_DEFAULT_HORIZONTAL,
      );
    }
  }, [reviewVideoLandscape, isCompactLayout]);

  const verdictMode = getVerdictMode({
    isAdmin,
    isReviewer,
    status: capture?.status,
  });
  // Staff reading a capture (reviewer or admin), as opposed to its owner.
  const isStaffView = verdictMode !== "none" || isAdmin;
  const listPath = taskListPathFor(verdictMode, isAdmin);
  const editHref = `/capture/${captureId}/edit`;

  // Only the reviewer's first pass is gated; the admin's paths are not.
  const checklistStatus =
    verdictMode === "review"
      ? getChecklistStatus(checklist, feedbackState)
      : null;

  const { isSubmitting, saveProgress, handleApprove, handleDeny, handleSkip } =
    useReviewVerdictActions({
      capture,
      traceData,
      draftVersion,
      feedbackState,
      mode: verdictMode,
      listPath,
      editHref,
      approveBlockedReason: checklistStatus?.approveBlockedReason ?? null,
      denyBlockedReason: checklistStatus?.sendBackBlockedReason ?? null,
    });

  const {
    videoRef,
    currentTime,
    videoDuration,
    isPlaying,
    sortedScreens,
    handleScreenSelect,
    handleScreenStep,
    handleMarkerStripScrub,
    togglePlayback,
    handleVideoSeeking,
    handleOnVideoLoadedMetadata,
    handleOnVideoTimeUpdate,
    handleOnVideoPlay,
    handleOnVideoPause,
  } = useIOSReviewPlayback({
    captureDbId,
    traceData,
    setTraceData,
    activeScreenId,
    setActiveScreenId,
    isSubmitting,
  });

  // Staff fix screens in place; every saved fix is a new draft.
  const canFix = verdictMode !== "none";
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
  const [isAddingScreen, setIsAddingScreen] = useState(false);
  // Set synchronously, so a double click cannot start two frame grabs.
  const isAddingScreenRef = useRef(false);
  const handleAddScreen = async () => {
    const video = videoRef.current;
    if (!video || !traceData || isAddingScreenRef.current) return;
    video.pause();
    const time = video.currentTime;
    if (
      traceData.screens.some(
        (screen) =>
          Math.abs(screen.timestamp - time) < DUPLICATE_SCREEN_SECONDS,
      )
    ) {
      toast.error(
        "There is already a screen at this time. Move to the missing step first.",
      );
      return;
    }
    isAddingScreenRef.current = true;
    setIsAddingScreen(true);
    try {
      const frame = await extractVideoFrame(video, time, {
        mimeType: "image/png",
        output: "object-url",
        preferOffscreenCanvas: true,
      });
      fixes.openAddScreen(frame);
    } catch {
      toast.error("Could not get the frame. Pause the video and try again.");
    } finally {
      isAddingScreenRef.current = false;
      setIsAddingScreen(false);
    }
  };
  const fixScreen = fixes.fixTarget?.screen;
  const fixScreensAfter =
    traceData && fixes.fixTarget
      ? fixes.fixTarget.isNew
        ? [...traceData.screens, fixes.fixTarget.screen].sort(
            (a, b) => a.timestamp - b.timestamp,
          )
        : traceData.screens
      : [];
  const fixScreenNumber = fixScreen
    ? fixScreensAfter.findIndex((screen) => screen.id === fixScreen.id) + 1
    : 0;

  // Arrows in the screen viewer step through the trace's screens.
  const fixNeighbours = (() => {
    if (!traceData || !fixScreen || fixes.fixTarget?.isNew) {
      return { previous: null, next: null };
    }
    const index = traceData.screens.findIndex(
      (screen) => screen.id === fixScreen.id,
    );
    return {
      previous: traceData.screens[index - 1]?.id ?? null,
      next: traceData.screens[index + 1]?.id ?? null,
    };
  })();
  const handleViewerNavigate = (screenId: string, mode: FixTab) => {
    fixes.openFix(screenId, mode);
    const screen = traceData?.screens.find((s) => s.id === screenId);
    if (screen) handleScreenSelect(screen.id, screen.timestamp);
  };
  // F: fix the active screen (staff, once its image has loaded).
  useHotkeys(
    "f",
    (event) => {
      event.preventDefault();
      if (activeScreenId) fixes.openFix(activeScreenId, "gesture");
    },
    {
      enabled:
        canFix &&
        !isSubmitting &&
        !fixes.fixTarget &&
        !!traceData?.screens.find((screen) => screen.id === activeScreenId)
          ?.src,
    },
    [activeScreenId, fixes.openFix],
  );
  const summaryBlock = traceData ? (
    <InteractionSummaryEditor
      summary={traceData.description}
      canEdit={canFix && !isSubmitting}
      isSaving={fixes.isSaving}
      onSave={fixes.saveTaskDescription}
      textClassName="text-[13px]"
    />
  ) : null;

  const { hotkeyAction: screenCommentsHotkeyAction } = useReviewCommentHotkeys({
    isSubmitting,
    sortedScreensLength: traceData?.screens.length ?? 0,
    hasActiveScreen: !!activeScreenId,
    onScreenStep: handleScreenStep,
  });

  useEffect(() => {
    const fetchDraftFiles = async () => {
      const files = await getDraftFiles(captureId);
      if (!files.ok) {
        console.error("Failed to fetch files");
        return;
      }
      if (files.data.length === 0) {
        setHasNoDraft(true);
        return;
      }
      const regexFileVersionRule = /draft-(\d+)\.json$/;
      const draftFiles = files.data;
      files.data.sort((a, b) => {
        const versionA = a.fileKey.match(regexFileVersionRule);
        const versionB = b.fileKey.match(regexFileVersionRule);
        if (versionA && versionB) {
          return parseInt(versionA[1]) - parseInt(versionB[1]);
        }
        return 0;
      });
      const latestDraftFile = draftFiles[draftFiles.length - 1];
      setDraftVersion(draftVersionFromKey(latestDraftFile.fileKey));
      const signedLatestDraftFileRes = await getSignedCaptureFileUrl(
        captureId,
        latestDraftFile.fileKey,
      );
      if (!signedLatestDraftFileRes.ok) {
        console.error("Failed to generate signed URL");
        return;
      }
      const draftFileResponse = await fetch(
        signedLatestDraftFileRes.data.signedUrl,
      );
      const draftFormData: DraftTraceFormData = await draftFileResponse.json();
      const screens = draftFormData.screens.map((s) => {
        return { id: s.id, src: "", timestamp: s.timestamp };
      });
      const vhs = draftFormData.screens
        .map((s) => {
          return { [s.id]: {} };
        })
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});
      const gestures = draftFormData.gestures;
      const redactions = draftFormData.redactions;
      const description = draftFormData.description;
      const iOSVersion = draftFormData.iOSVersion ?? undefined;
      const iPhoneVersion = draftFormData.iPhoneVersion ?? undefined;
      const sortedScreens = screens.sort((a, b) => a.timestamp - b.timestamp);
      setTraceData({
        screens: sortedScreens,
        vhs,
        gestures,
        redactions,
        description,
        iOSVersion,
        iPhoneVersion,
      });
      setActiveScreenId(sortedScreens[0]?.id ?? null);
      setFeedbackState(EMPTY_REVIEW_FEEDBACK_STATE);
      setHasHydratedFeedback(false);
    };
    fetchDraftFiles();
  }, [captureId]);

  useEffect(() => {
    if (!capture || !traceData || hasHydratedFeedback) {
      return;
    }

    setFeedbackState(
      hydrateReviewFeedbackState({
        screens: traceData.screens,
        annotateFeedback: capture.annotateFeedback,
        redactFeedback: capture.redactFeedback,
        summarizeFeedback: capture.summarizeFeedback,
      }),
    );
    setHasHydratedFeedback(true);
  }, [capture, hasHydratedFeedback, traceData]);
  const issueSummary = getReviewIssueSummary(feedbackState);
  return (
    <main className="relative flex h-[calc(100dvh-64px)] w-full flex-grow flex-col">
      {!isTraceLoading && (
        <ResizablePanelGroup
          direction={isCompactLayout ? "vertical" : "horizontal"}
          className="h-full min-h-0 w-full flex-1"
        >
          {/* Left: Video + Feedback + Approve/Deny */}
          <ResizablePanel
            ref={reviewVideoPanelRef}
            defaultSize={isCompactLayout ? 35 : 23}
            minSize={isCompactLayout ? 28 : 25}
            maxSize={
              isCompactLayout
                ? reviewVideoLandscape
                  ? 54
                  : 51
                : reviewVideoLandscape
                  ? 37
                  : 28
            }
            className="box-border flex h-full min-h-0 w-full flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950"
          >
            {traceData && capture && (
              <ReviewVideoPanelIOS
                summary={summaryBlock}
                traceData={traceData}
                isAdmin={isStaffView}
                listHref={listPath}
                videoRef={videoRef}
                activeScreenId={activeScreenId}
                commentsByScreen={feedbackState.commentsByScreen}
                currentTime={currentTime}
                videoDuration={videoDuration}
                onScreenSelect={handleScreenSelect}
                onScrubVideo={handleMarkerStripScrub}
                onVideoLoadedMetadata={handleOnVideoLoadedMetadata}
                onVideoTimeUpdate={handleOnVideoTimeUpdate}
                onVideoSeeking={handleVideoSeeking}
                onVideoPlay={handleOnVideoPlay}
                onVideoPause={handleOnVideoPause}
                isPlaying={isPlaying}
                onTogglePlayback={togglePlayback}
                onVideoLayoutOrientationChange={(orientation) =>
                  setReviewVideoLandscape(orientation === "landscape")
                }
                onAddScreen={
                  canFix && !isSubmitting
                    ? () => void handleAddScreen()
                    : undefined
                }
                isAddingScreen={isAddingScreen || fixes.isSaving}
              />
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Gallery + Screen Comments (nested horizontal split) */}
          <ResizablePanel
            defaultSize={isCompactLayout ? 65 : 77}
            minSize={
              isCompactLayout
                ? reviewVideoLandscape
                  ? 42
                  : 45
                : reviewVideoLandscape
                  ? 63
                  : 65
            }
            maxSize={isCompactLayout ? 72 : 80}
            className="box-border h-full min-h-0 w-full"
          >
            <ResizablePanelGroup
              direction="horizontal"
              className="h-full w-full"
            >
              {/* Gallery — left/center */}
              <ResizablePanel
                id="review-gallery"
                order={1}
                defaultSize={isStaffView ? 60 : 100}
                minSize={50}
                maxSize={isStaffView ? 80 : 100}
                className="min-h-0 overflow-y-auto bg-neutral-50 dark:bg-neutral-950"
              >
                {traceData && (
                  <ReviewGalleryIOS
                    traceData={traceData}
                    activeScreenId={activeScreenId}
                    commentsByScreen={feedbackState.commentsByScreen}
                    onScreenSelect={handleScreenSelect}
                    captureTimestamp={captureTimestamp}
                    selectedScreenIds={
                      isComposerInScreenMode
                        ? gallerySelectedScreenIds
                        : undefined
                    }
                    onSelectedScreenToggle={
                      isComposerInScreenMode ? handleGalleryToggle : undefined
                    }
                    fixedScreenIds={fixes.fixedScreenIds}
                    onOpenScreen={(screenId) => fixes.openFix(screenId, "view")}
                    renderCardFooter={
                      canFix
                        ? (screenId, index) => (
                            <FixScreenButton
                              screenNumber={index + 1}
                              disabled={
                                isSubmitting ||
                                fixes.isSaving ||
                                !traceData.screens.find(
                                  (screen) => screen.id === screenId,
                                )?.src
                              }
                              onClick={() => fixes.openFix(screenId, "gesture")}
                            />
                          )
                        : undefined
                    }
                  />
                )}
              </ResizablePanel>

              {/* Screen Comments Panel — right. Staff only: the owner
                  reads feedback on the edit page, not here. */}
              {isStaffView && <ResizableHandle withHandle />}
              {isStaffView && (
                <ResizablePanel
                  id="review-comments"
                  order={2}
                  defaultSize={40}
                  minSize={20}
                  maxSize={50}
                  className="min-h-0 overflow-hidden"
                >
                  {traceData && (
                    <ScreenCommentsPanel
                      screens={traceData.screens}
                      activeScreenId={activeScreenId}
                      feedbackState={feedbackState}
                      onFeedbackStateChange={setFeedbackState}
                      hotkeyAction={screenCommentsHotkeyAction}
                      onJumpToScreen={(screenId) => {
                        const nextScreen = sortedScreens.find(
                          (screen) => screen.id === screenId,
                        );
                        if (nextScreen) {
                          handleScreenSelect(
                            nextScreen.id,
                            nextScreen.timestamp,
                          );
                        }
                      }}
                      externalSelectedScreenIds={gallerySelectedScreenIds}
                      onExternalSelectedScreenIdsChange={
                        setGallerySelectedScreenIds
                      }
                      onComposerScreenModeChange={setIsComposerInScreenMode}
                      checklist={checklistStatus ? checklist : undefined}
                      onChecklistMark={(category, mark) =>
                        setChecklist((prev) => ({ ...prev, [category]: mark }))
                      }
                      onPassAll={() => setChecklist(passUnflaggedSteps)}
                    />
                  )}
                </ResizablePanel>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
      <PublishProgressDialog progress={saveProgress} />
      <ScreenViewerDialog
        target={fixes.fixTarget}
        canEdit={canFix && !isSubmitting}
        previousScreenId={fixNeighbours.previous}
        nextScreenId={fixNeighbours.next}
        onNavigate={handleViewerNavigate}
        screenNumber={fixScreenNumber}
        screenCount={fixScreensAfter.length}
        isLastScreen={fixScreenNumber === fixScreensAfter.length}
        timeLabel={
          fixScreen ? `${fixScreen.timestamp.toFixed(1)} s` : undefined
        }
        gesture={fixScreen ? traceData?.gestures[fixScreen.id] : undefined}
        redactions={
          fixScreen ? (traceData?.redactions[fixScreen.id] ?? []) : []
        }
        noteCount={
          fixScreen
            ? (feedbackState.commentsByScreen[fixScreen.id]?.length ?? 0)
            : 0
        }
        isSaving={fixes.isSaving}
        onSave={fixes.saveScreen}
        onRemove={fixes.removeScreen}
        onClose={fixes.closeFix}
      />
      {verdictMode !== "none" && capture && (traceData || hasNoDraft) && (
        <VerdictBar
          mode={verdictMode}
          hasDraft={!!traceData && !!draftVersion}
          issueSummary={issueSummary}
          isSubmitting={isSubmitting}
          saveProgress={saveProgress}
          onApprove={() => void handleApprove()}
          onDeny={() => void handleDeny()}
          onSkip={() => void handleSkip()}
          editHref={editHref}
          checklistLabel={checklistStatus?.label}
          approveBlockedReason={checklistStatus?.approveBlockedReason ?? null}
          denyBlockedReason={checklistStatus?.sendBackBlockedReason ?? null}
          additionalShortcuts={[
            ...(canFix ? [{ label: "Fix screen", keys: "F" }] : []),
            { label: "Previous screen", keys: "[" },
            { label: "Next screen", keys: "]" },
            { label: "Replay around screen", keys: "R" },
            { label: "Play / pause", keys: "Space" },
            { label: "Custom issue", keys: "O" },
            { label: "Remove last screen issue", keys: "Backspace" },
            { label: "Issue chips", keys: "1-9" },
          ]}
        />
      )}
    </main>
  );
}
