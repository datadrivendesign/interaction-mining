"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DraftTraceFormData,
  FrameData,
  TraceFormData,
} from "../../../edit/components/types";
import { CaptureStatus } from "@prisma/client";
import { useCapture } from "@/lib/hooks/capture";
import { ReviewPanelAndroid } from "./review-panel-android";
import { ReviewGalleryAndroid } from "./review-gallery-android";
import { getDraftFiles } from "../../../edit/util";
import { generateSignedCloudFrontURL } from "@/lib/aws/s3/server";
import { CaptureScreenFile, getCaptureFiles, ListedFiles } from "@/lib/actions";
import {
  denyCapture,
  validateApprovePermissions,
} from "../../utils/capture-actions";
import { toast } from "sonner";
import { handleTraceSave } from "../../../edit/util";
import { revalidateCaptureCaches, updateCapture } from "@/lib/actions";
import { ScreenCommentsPanel } from "../shared/screen-comments-panel";
import { useHotkeys } from "react-hotkeys-hook";
import { VerdictBar } from "../shared/verdict-bar";
import {
  EMPTY_REVIEW_FEEDBACK_STATE,
  mergeFeedbackStrings,
  ReviewFeedbackState,
  serializeReviewFeedbackState,
} from "../../utils/review-feedback";

export function EvaluationClientAndroid({ isAdmin }: { isAdmin: boolean }) {
  const params = useParams();
  const router = useRouter();
  const captureId = params.captureId as string;
  const [traceData, setTraceData] = useState<TraceFormData>();
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<ReviewFeedbackState>(
    EMPTY_REVIEW_FEEDBACK_STATE,
  );
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });
  const isProcessingRef = useRef(false);

  const populateDraftScreens = useCallback(
    async (
      files: ListedFiles[],
      traceData: TraceFormData,
    ): Promise<{ screens: FrameData[]; vhs: { [key: string]: any } }> => {
      const screensCopy: FrameData[] = [];
      const vhsCopy: { [key: string]: any } = {};
      for (const screen of traceData.screens) {
        if (!screen.src) {
          const frame = files.find((f) => f.fileKey.includes(screen.id));
          if (frame) {
            const frameResponse = await fetch(frame.fileUrl);
            const frameJson: CaptureScreenFile = await frameResponse.json();
            screensCopy.push({
              ...screen,
              src: `data:image/png;base64,${frameJson.img}`.trim(),
            });
            vhsCopy[screen.id] = JSON.parse(frameJson.vh);
          }
        }
      }
      return {
        screens: screensCopy,
        vhs: vhsCopy,
      };
    },
    [],
  );

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
    if (!capture || !traceData) {
      return;
    }

    const loadFramesAndPopulateCapture = async () => {
      if (isProcessingRef.current) {
        return;
      }
      try {
        isProcessingRef.current = true;
        const captureFiles = await getCaptureFiles(captureId);
        if (!captureFiles.ok) {
          console.error("Failed to fetch capture files");
          return;
        }
        const regexRule =
          /(\d{4})-(\d{2})-(\d{2}) (\d{2})\:(\d{2})\:(\d{2})\.(\d{3})(.+)\.(json)$/;
        const frameFiles = captureFiles.data.filter((f) =>
          regexRule.test(f.fileName.toLowerCase()),
        );
        if (
          traceData.screens.filter((s) => s.src.length === 0).length === 0 ||
          traceData.vhs?.length === 0
        ) {
          return;
        }
        const { screens, vhs } = await populateDraftScreens(
          frameFiles,
          traceData,
        );
        setTraceData((prevData) => {
          if (!prevData) {
            return prevData;
          }
          return {
            ...prevData,
            screens: screens.sort((a, b) => a.timestamp - b.timestamp),
            vhs: vhs,
          };
        });
      } catch (error) {
        console.error(`Error loading video: ${error}`);
      } finally {
        isProcessingRef.current = false;
      }
    };

    loadFramesAndPopulateCapture();
  }, [capture?.id, traceData?.screens, traceData?.vhs, populateDraftScreens]);

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
    };
    fetchDraftFiles();
  }, [captureId]);

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
        mergeFeedbackStrings(
          capture.annotateFeedback,
          serializedFeedback.annotateFeedback,
        ),
        mergeFeedbackStrings(
          capture.redactFeedback,
          serializedFeedback.redactFeedback,
        ),
        mergeFeedbackStrings(
          capture.summarizeFeedback,
          serializedFeedback.summarizeFeedback,
        ),
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

  const totalScreenIssues = Object.values(feedbackState.commentsByScreen).reduce(
    (count, comments) => count + comments.length,
    0,
  );
  const flowIssueCount = feedbackState.flowComments.length;
  const totalIssues = totalScreenIssues + flowIssueCount;
  const screensWithIssues = Object.values(feedbackState.commentsByScreen).filter(
    (comments) => comments.length > 0,
  ).length;
  const issueSummary =
    totalIssues === 0
      ? "No issues flagged"
      : `${totalIssues} issue${totalIssues === 1 ? "" : "s"} across ${screensWithIssues} screen${screensWithIssues === 1 ? "" : "s"}${flowIssueCount > 0 ? ` and ${flowIssueCount} flow-level issue${flowIssueCount === 1 ? "" : "s"}` : ""}`;
  const summarizeFeedbackPreview =
    capture && traceData
      ? mergeFeedbackStrings(
          capture.summarizeFeedback,
          serializeReviewFeedbackState({
            feedbackState,
            screens: traceData.screens,
          }).summarizeFeedback,
        )
      : "";

  return (
    <main className="relative flex h-[calc(100dvh-64px)] w-full flex-grow flex-col">
      {!isTraceLoading && (
        <ResizablePanelGroup
          direction={isCompactLayout ? "vertical" : "horizontal"}
          className="min-h-0 h-full w-full flex-1"
        >
          {/* Left: Feedback + Approve/Deny */}
          <ResizablePanel
            defaultSize={isCompactLayout ? 38 : 25}
            minSize={isCompactLayout ? 28 : 25}
            maxSize={isCompactLayout ? 55 : 30}
            className="min-h-0 bg-neutral-50 dark:bg-neutral-950 box-border w-full h-full overflow-hidden flex flex-col"
          >
            {traceData && capture && (
              <ReviewPanelAndroid
                traceData={traceData}
                isAdmin={isAdmin}
                summarizeFeedback={summarizeFeedbackPreview}
                isSubmitting={isSubmitting}
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
            <ResizablePanelGroup direction="horizontal" className="w-full h-full">
              {/* Gallery — left/center */}
              <ResizablePanel
                defaultSize={70}
                minSize={50}
                maxSize={85}
                className="min-h-0 overflow-y-auto bg-neutral-50 dark:bg-neutral-950"
              >
                {traceData && (
                  <ReviewGalleryAndroid
                    traceData={traceData}
                    activeScreenId={activeScreenId}
                    commentsByScreen={feedbackState.commentsByScreen}
                    onScreenSelect={setActiveScreenId}
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
        />
      )}
    </main>
  );
}
