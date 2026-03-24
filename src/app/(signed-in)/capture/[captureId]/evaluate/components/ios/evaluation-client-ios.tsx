"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DraftTraceFormData,
  FrameData,
  TraceFormData,
} from "../../../edit/components/types";
import { CaptureStatus } from "@prisma/client";
import { useCapture } from "@/lib/hooks/capture";
import { ReviewPanelIOS } from "./review-panel-ios";
import { ReviewGalleryIOS } from "./review-gallery-ios";
import { getDraftFiles } from "../../../edit/util";
import { generateSignedCloudFrontURL } from "@/lib/aws/s3/server";
import { extractVideoFrame } from "../../../edit/components/repair-screen/util/ios-video-operations";
import { fetchVideoFile } from "../../utils/file-fetch";
import {
  denyCapture,
  validateApprovePermissions,
} from "../../utils/capture-actions";
import { toast } from "sonner";
import { handleTraceSave } from "../../../edit/util";
import { revalidateCaptureCaches, updateCapture } from "@/lib/actions";
import {
  ScreenCommentsHotkeyAction,
  ScreenCommentsPanel,
} from "../shared/screen-comments-panel";
import { useHotkeys } from "react-hotkeys-hook";
import { VerdictBar } from "../shared/verdict-bar";
import {
  EMPTY_REVIEW_FEEDBACK_STATE,
  hydrateReviewFeedbackState,
  ReviewFeedbackState,
  serializeReviewFeedbackState,
} from "../../utils/review-feedback";
import { findTraceIssueByShortcut } from "../shared/trace-issues";

export function EvaluationClientIOS({ isAdmin }: { isAdmin: boolean }) {
  const params = useParams();
  const router = useRouter();
  const captureId = params.captureId as string;
  const [traceData, setTraceData] = useState<TraceFormData>();
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<ReviewFeedbackState>(
    EMPTY_REVIEW_FEEDBACK_STATE,
  );
  const [hasHydratedFeedback, setHasHydratedFeedback] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [screenCommentsHotkeyAction, setScreenCommentsHotkeyAction] =
    useState<ScreenCommentsHotkeyAction | null>(null);
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const isProcessingRef = useRef(false);
  const hotkeyActionNonceRef = useRef(0);
  const rafRef = useRef<number>(0);
  const scrubRafRef = useRef<number | null>(null);
  const pendingScrubTimeRef = useRef<number | null>(null);
  const livePhotoEndRef = useRef<number | null>(null);
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

  const populateDraftScreens = useCallback(
    async (video: HTMLVideoElement, screens: FrameData[]) => {
      const frames: FrameData[] = [];
      try {
        const screensCopy = screens.map((screen) => ({ ...screen }));
        await extractVideoFrame(video, 0.1);
        for (const s of screensCopy) {
          if (!s.src) {
            const f = await extractVideoFrame(video, s.timestamp);
            s.src = f.src;
          }
          frames.push(s);
        }
      } catch (error) {
        console.error(`Error extracting video frames: ${error}`);
      }
      return frames;
    },
    [],
  );

  useEffect(() => {
    if (!captureDbId || !traceData) {
      return;
    }

    const loadVideoAndPopulateScreens = async () => {
      if (isProcessingRef.current) {
        return;
      }
      try {
        isProcessingRef.current = true;
        const videoFiles = await fetchVideoFile(`uploads/${captureDbId}`);
        if (videoFiles.length === 0 || !videoRef.current) {
          return;
        }
        const video = videoRef.current;
        video.src = videoFiles[0].fileUrl;
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video load timeout"));
          }, 30000);

          const onLoadedData = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("error", onError);
            resolve();
          };

          const onError = (e: any) => {
            clearTimeout(timeout);
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("error", onError);
            reject(e);
          };

          video.addEventListener("loadeddata", onLoadedData, { once: true });
          video.addEventListener("error", onError, { once: true });
          if (video.readyState >= 2) {
            onLoadedData();
          }
        });
        if (traceData.screens.filter((s) => s.src.length === 0).length === 0) {
          return;
        }
        const frames = await populateDraftScreens(video, traceData.screens);
        setTraceData((prevData) => {
          if (!prevData) {
            return prevData;
          }
          return {
            ...prevData,
            screens: frames.sort((a, b) => a.timestamp - b.timestamp),
          };
        });
      } catch (error) {
        console.error(`Error loading video: ${error}`);
      } finally {
        isProcessingRef.current = false;
      }
    };

    loadVideoAndPopulateScreens();
  }, [captureDbId, populateDraftScreens, traceData]);

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

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const syncCurrentTime = () => {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      const nextTime = video.currentTime;
      setCurrentTime(nextTime);

      const replayEnd = livePhotoEndRef.current;
      if (replayEnd !== null && nextTime >= replayEnd) {
        video.pause();
        livePhotoEndRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(syncCurrentTime);
    };

    rafRef.current = requestAnimationFrame(syncCurrentTime);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (scrubRafRef.current !== null) {
        cancelAnimationFrame(scrubRafRef.current);
      }
    };
  }, []);

  const sortedScreens = useMemo(
    () =>
      [...(traceData?.screens ?? [])].sort((a, b) => a.timestamp - b.timestamp),
    [traceData?.screens],
  );
  const activeScreen =
    sortedScreens.find((screen) => screen.id === activeScreenId) ??
    sortedScreens[0] ??
    null;
  const activeScreenIndex = activeScreen
    ? sortedScreens.findIndex((screen) => screen.id === activeScreen.id)
    : -1;

  const queueScreenCommentsHotkeyAction = useCallback(
    (
      action:
        | { type: "select-issue"; issueId: string }
        | { type: "select-other" }
        | { type: "remove-last-screen-comment" },
    ) => {
      hotkeyActionNonceRef.current += 1;
      setScreenCommentsHotkeyAction({
        ...action,
        nonce: hotkeyActionNonceRef.current,
      });
    },
    [],
  );

  const clearReplayWindow = useCallback(() => {
    livePhotoEndRef.current = null;
  }, []);

  const seekVideoToTime = useCallback(
    (timestamp: number, options?: { pause?: boolean }) => {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      clearReplayWindow();
      const maxDuration = videoDuration > 0 ? videoDuration : timestamp;
      const clampedTimestamp = Math.max(0, Math.min(timestamp, maxDuration));

      if (options?.pause ?? true) {
        video.pause();
      }
      video.currentTime = clampedTimestamp;
      setCurrentTime(clampedTimestamp);
    },
    [clearReplayWindow, videoDuration],
  );

  const handleScreenSelect = useCallback(
    (screenId: string, timestamp: number) => {
      setActiveScreenId(screenId);
      seekVideoToTime(timestamp);
    },
    [seekVideoToTime],
  );

  const handleScreenStep = useCallback(
    (offset: number) => {
      if (sortedScreens.length === 0) {
        return;
      }

      const nextIndex =
        activeScreenIndex === -1
          ? 0
          : Math.max(
              0,
              Math.min(activeScreenIndex + offset, sortedScreens.length - 1),
            );
      const nextScreen = sortedScreens[nextIndex];
      if (!nextScreen) {
        return;
      }

      handleScreenSelect(nextScreen.id, nextScreen.timestamp);
    },
    [activeScreenIndex, handleScreenSelect, sortedScreens],
  );

  const getNearestScreenId = useCallback(
    (timestamp: number) => {
      if (sortedScreens.length === 0) {
        return null;
      }

      return sortedScreens.reduce((nearestScreen, candidateScreen) => {
        if (!nearestScreen) {
          return candidateScreen;
        }

        return Math.abs(candidateScreen.timestamp - timestamp) <
          Math.abs(nearestScreen.timestamp - timestamp)
          ? candidateScreen
          : nearestScreen;
      }, sortedScreens[0]).id;
    },
    [sortedScreens],
  );

  const commitScrubTime = useCallback(
    (timestamp: number) => {
      const nearestScreenId = getNearestScreenId(timestamp);
      if (nearestScreenId) {
        setActiveScreenId(nearestScreenId);
      }
      seekVideoToTime(timestamp);
    },
    [getNearestScreenId, seekVideoToTime],
  );

  const handleMarkerStripScrub = useCallback(
    (timestamp: number) => {
      pendingScrubTimeRef.current = timestamp;

      if (scrubRafRef.current !== null) {
        return;
      }

      scrubRafRef.current = requestAnimationFrame(() => {
        scrubRafRef.current = null;
        const nextTimestamp = pendingScrubTimeRef.current;
        pendingScrubTimeRef.current = null;
        if (nextTimestamp === null) {
          return;
        }

        commitScrubTime(nextTimestamp);
      });
    },
    [commitScrubTime],
  );

  const handleReplayActiveScreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !activeScreen || videoDuration <= 0) {
      return;
    }

    const replayStart = Math.max(0, activeScreen.timestamp - 1);
    const replayEnd = Math.min(videoDuration, activeScreen.timestamp + 1);

    livePhotoEndRef.current = replayEnd;
    video.currentTime = replayStart;
    setCurrentTime(replayStart);

    try {
      await video.play();
    } catch (error) {
      livePhotoEndRef.current = null;
      console.error(`Error replaying screen context: ${error}`);
    }
  }, [activeScreen, videoDuration]);

  const handleApprove = useCallback(async () => {
    if (!capture || !traceData) {
      return;
    }

    try {
      setIsSubmitting(true);
      const approveRes = await validateApprovePermissions();
      if (!approveRes.ok) {
        throw new Error(approveRes.message);
      }
      const saveRes = await handleTraceSave(traceData, capture);
      if (!saveRes.ok) {
        throw new Error(saveRes.message);
      }
      const updateRes = await updateCapture(capture.id, {
        status: CaptureStatus.APPROVED,
      });
      if (!updateRes.ok) {
        throw new Error(updateRes.message);
      }
      await revalidateCaptureCaches();
      toast.success("Capture approved successfully");
      router.push("/admin/tasks");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [capture, router, traceData]);

  const handleDeny = useCallback(async () => {
    if (!capture || !traceData) {
      return;
    }

    try {
      setIsSubmitting(true);
      const serializedFeedback = serializeReviewFeedbackState({
        feedbackState,
        screens: traceData.screens,
      });
      const denyRes = await denyCapture(
        capture,
        serializedFeedback.annotateFeedback,
        serializedFeedback.redactFeedback,
        serializedFeedback.summarizeFeedback,
      );
      if (!denyRes.ok) {
        throw new Error(denyRes.message);
      }
      await revalidateCaptureCaches();
      toast.success("Capture denied successfully");
      router.push("/admin/tasks");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [capture, feedbackState, router, traceData]);

  useHotkeys(
    "ctrl+shift+a",
    (event) => {
      event.preventDefault();
      void handleApprove();
    },
    {
      enabled: isAdmin && !isSubmitting,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [handleApprove, isAdmin, isSubmitting],
  );

  useHotkeys(
    "ctrl+shift+d",
    (event) => {
      event.preventDefault();
      void handleDeny();
    },
    {
      enabled: isAdmin && !isSubmitting,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [handleDeny, isAdmin, isSubmitting],
  );

  useHotkeys(
    "bracketleft",
    (event) => {
      event.preventDefault();
      handleScreenStep(-1);
    },
    {
      enabled: !isSubmitting && sortedScreens.length > 0,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [handleScreenStep, isSubmitting, sortedScreens.length],
  );

  useHotkeys(
    "bracketright",
    (event) => {
      event.preventDefault();
      handleScreenStep(1);
    },
    {
      enabled: !isSubmitting && sortedScreens.length > 0,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [handleScreenStep, isSubmitting, sortedScreens.length],
  );

  useHotkeys(
    "r",
    (event) => {
      event.preventDefault();
      void handleReplayActiveScreen();
    },
    {
      enabled: !isSubmitting && !!activeScreen && videoDuration > 0,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [activeScreen, handleReplayActiveScreen, isSubmitting, videoDuration],
  );

  useHotkeys(
    "o",
    (event) => {
      event.preventDefault();
      queueScreenCommentsHotkeyAction({ type: "select-other" });
    },
    {
      enabled: !isSubmitting,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [isSubmitting, queueScreenCommentsHotkeyAction],
  );

  useHotkeys(
    "backspace",
    (event) => {
      event.preventDefault();
      queueScreenCommentsHotkeyAction({
        type: "remove-last-screen-comment",
      });
    },
    {
      enabled: !isSubmitting && !!activeScreen,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [activeScreen, isSubmitting, queueScreenCommentsHotkeyAction],
  );

  useHotkeys(
    "1,2,3,4,5,6,7,8,9",
    (event) => {
      const shortcutIssue = findTraceIssueByShortcut(
        Number.parseInt(event.key, 10),
      );
      if (!shortcutIssue) {
        return;
      }

      event.preventDefault();
      queueScreenCommentsHotkeyAction({
        type: "select-issue",
        issueId: shortcutIssue.id,
      });
    },
    {
      enabled: !isSubmitting,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [isSubmitting, queueScreenCommentsHotkeyAction],
  );

  const totalScreenIssues = Object.values(
    feedbackState.commentsByScreen,
  ).reduce((count, comments) => count + comments.length, 0);
  const flowIssueCount = feedbackState.flowComments.length;
  const totalIssues = totalScreenIssues + flowIssueCount;
  const screensWithIssues = Object.values(
    feedbackState.commentsByScreen,
  ).filter((comments) => comments.length > 0).length;
  const issueSummary =
    totalIssues === 0
      ? "No issues flagged"
      : `${totalIssues} issue${totalIssues === 1 ? "" : "s"} across ${screensWithIssues} screen${screensWithIssues === 1 ? "" : "s"}${flowIssueCount > 0 ? ` and ${flowIssueCount} flow-level issue${flowIssueCount === 1 ? "" : "s"}` : ""}`;
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
              <ReviewPanelIOS
                traceData={traceData}
                isAdmin={isAdmin}
                videoRef={videoRef}
                activeScreenId={activeScreenId}
                commentsByScreen={feedbackState.commentsByScreen}
                currentTime={currentTime}
                videoDuration={videoDuration}
                onScreenSelect={handleScreenSelect}
                onScrubVideo={handleMarkerStripScrub}
                onVideoLoadedMetadata={(video) => {
                  setVideoDuration(video.duration || 0);
                }}
                onVideoTimeUpdate={(video) => {
                  setCurrentTime(video.currentTime);
                }}
                onVideoPlay={() => setIsPlaying(true)}
                onVideoPause={() => {
                  setIsPlaying(false);
                  clearReplayWindow();
                }}
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
