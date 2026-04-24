"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DraftTraceFormData,
  TraceFormData,
} from "../../../edit/components/types";
import { useCapture } from "@/lib/hooks/capture";
import { ReviewVideoPanelIOS } from "./review-video-panel-ios";
import { ReviewGalleryIOS } from "./review-gallery-ios";
import { getDraftFiles } from "../../../edit/util";
import { generateSignedCloudFrontURL } from "@/lib/aws/s3/server";
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
import { useIOSReviewPlayback } from "./use-ios-review-playback";

export function EvaluationClientIOS({ isAdmin }: { isAdmin: boolean }) {
  const params = useParams();
  const captureId = params.captureId as string;
  const [traceData, setTraceData] = useState<TraceFormData>();
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<ReviewFeedbackState>(
    EMPTY_REVIEW_FEEDBACK_STATE,
  );
  const [hasHydratedFeedback, setHasHydratedFeedback] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });
  const captureDbId = capture?.id ?? null;

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

  const { isSubmitting, handleApprove, handleDeny } = useReviewVerdictActions({
    capture,
    traceData,
    feedbackState,
    isAdmin,
  });

  const {
    videoRef,
    currentTime,
    videoDuration,
    sortedScreens,
    handleScreenSelect,
    handleScreenStep,
    handleMarkerStripScrub,
    handleReplayScreen,
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
        console.error("No draft files found");
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
      const signedLatestDraftFileRes = await generateSignedCloudFrontURL(
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
          className="min-h-0 h-full w-full flex-1"
        >
          {/* Left: Video + Feedback + Approve/Deny */}
          <ResizablePanel
            defaultSize={isCompactLayout ? 38 : 25}
            minSize={isCompactLayout ? 28 : 25}
            maxSize={isCompactLayout ? 55 : 30}
            className="min-h-0 bg-neutral-50 dark:bg-neutral-950 box-border w-full h-full overflow-hidden flex flex-col"
          >
            {traceData && capture && (
              <ReviewVideoPanelIOS
                traceData={traceData}
                isAdmin={isAdmin}
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
              />
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: Gallery + Screen Comments (nested horizontal split) */}
          <ResizablePanel
            defaultSize={isCompactLayout ? 62 : 75}
            minSize={isCompactLayout ? 45 : 65}
            maxSize={isCompactLayout ? 72 : 80}
            className="min-h-0 box-border w-full h-full"
          >
            <ResizablePanelGroup
              direction="horizontal"
              className="w-full h-full"
            >
              {/* Gallery — left/center */}
              <ResizablePanel
                defaultSize={70}
                minSize={50}
                maxSize={85}
                className="min-h-0 overflow-y-auto bg-neutral-50 dark:bg-neutral-950"
              >
                {traceData && (
                  <ReviewGalleryIOS
                    traceData={traceData}
                    activeScreenId={activeScreenId}
                    commentsByScreen={feedbackState.commentsByScreen}
                    onScreenSelect={handleScreenSelect}
                    onReplayScreen={(screenId) =>
                      void handleReplayScreen(screenId)
                    }
                    canReplay={videoDuration > 0}
                  />
                )}
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Screen Comments Panel — right */}
              <ResizablePanel
                defaultSize={30}
                minSize={20}
                maxSize={45}
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
                        handleScreenSelect(nextScreen.id, nextScreen.timestamp);
                      }
                    }}
                  />
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
      {isAdmin && capture && traceData && (
        <VerdictBar
          issueSummary={issueSummary}
          isSubmitting={isSubmitting}
          onApprove={() => void handleApprove()}
          onDeny={() => void handleDeny()}
          additionalShortcuts={[
            { label: "Previous screen", keys: "[" },
            { label: "Next screen", keys: "]" },
            { label: "Replay around screen", keys: "R" },
            { label: "Custom issue", keys: "O" },
            { label: "Remove last screen issue", keys: "Backspace" },
            { label: "Issue chips", keys: "1-9" },
          ]}
        />
      )}
    </main>
  );
}
