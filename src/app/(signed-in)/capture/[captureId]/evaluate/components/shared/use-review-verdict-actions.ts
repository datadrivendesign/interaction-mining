"use client";

import { Capture } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { revalidateCaptureCaches } from "@/lib/actions";
import { TraceFormData } from "../../../edit/components/types";
import { handleTraceSave } from "../../../edit/util/export";
import {
  approveCapture,
  finalDeny,
  getNextReviewingCaptureId,
  reviewerApprove,
  sendBack,
  validateApprovePermissions,
} from "../../utils/capture-actions";
import {
  ReviewFeedbackState,
  serializeReviewFeedbackState,
} from "../../utils/review-feedback";
import { summarizeReviewVerdict } from "../../utils/review-verdict-summary";
import { canEditInMode, queueStatusFor, VerdictMode } from "./verdict-mode";

/** Rendering and uploading progress while the admin's Approve publishes. */
export type SaveProgress = { done: number; total: number };

/** Longest duration the server accepts; a tab left open overnight is capped. */
const MAX_REVIEW_DURATION_MS = 24 * 60 * 60 * 1000;

export function useReviewVerdictActions({
  capture,
  traceData,
  draftVersion,
  feedbackState,
  mode,
  listPath,
  editHref,
  approveBlockedReason = null,
  denyBlockedReason = null,
}: {
  capture?: Capture | null;
  traceData?: TraceFormData;
  /** Version (`draft-<ms>`) `traceData` was loaded from; null when no draft. */
  draftVersion: string | null;
  feedbackState: ReviewFeedbackState;
  mode: VerdictMode;
  /** Where to go when the queue is empty or the next capture can't load. */
  listPath: string;
  /** Edit page for this capture; Ctrl+Shift+E opens it in REVIEWING. */
  editHref?: string;
  /** Checklist gate: why Approve is off now (button and hotkey), or null. */
  approveBlockedReason?: string | null;
  /** Checklist gate: why Send back / Deny is off now, or null. */
  denyBlockedReason?: string | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveProgress, setSaveProgress] = useState<SaveProgress | null>(null);
  // Review duration runs from the first render of this capture's page.
  const openedAtRef = useRef(Date.now());
  const enabled = mode !== "none";
  const queueStatus = queueStatusFor(mode);

  const reviewMetrics = useCallback(
    () => ({
      reviewDurationMs: Math.min(
        Math.max(0, Math.round(Date.now() - openedAtRef.current)),
        MAX_REVIEW_DURATION_MS,
      ),
    }),
    [],
  );

  const navigateAfterVerdict = useCallback(
    async (
      successMessage: string,
      emptyQueueMessage = "Review queue complete.",
    ) => {
      if (!capture) {
        router.push(listPath);
        return;
      }

      const nextCaptureRes = await getNextReviewingCaptureId(
        capture.id,
        queueStatus,
      );
      if (!nextCaptureRes.ok) {
        console.error("Failed to fetch next capture:", nextCaptureRes.message);
        toast.success(`${successMessage} Returning to task list.`);
        router.push(listPath);
        return;
      }

      if (nextCaptureRes.data) {
        toast.success(`${successMessage} Loading next capture...`);
        router.push(`/capture/${nextCaptureRes.data}/evaluate`);
        return;
      }

      toast.success(`${successMessage} ${emptyQueueMessage}`);
      router.push(listPath);
    },
    [capture, listPath, queueStatus, router],
  );

  // Approvals carry no issues: an approval means nothing was left to send
  // back. Summarizing the live state here would record the previous
  // rejection's comments, which reopening a bounced capture loads back in.
  // `screenCount` stays — it describes the trace, not the feedback.
  const approvalSummary = useCallback(
    () => ({
      issueIds: [],
      issueCategories: [],
      destinations: [],
      screenIssueCount: 0,
      flowIssueCount: 0,
      screenCount: traceData?.screens.length ?? 0,
    }),
    [traceData],
  );

  const handleApprove = useCallback(async () => {
    if (!capture || !traceData || isSubmitting || mode === "none") {
      return;
    }
    if (approveBlockedReason) {
      toast.error(approveBlockedReason);
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "review") {
        if (!draftVersion) {
          throw new Error("No draft saved. Send back to worker.");
        }
        const res = await reviewerApprove(
          capture.id,
          draftVersion,
          reviewMetrics(),
          approvalSummary(),
        );
        if (!res.ok) {
          throw new Error(res.message);
        }
        await revalidateCaptureCaches();
        await navigateAfterVerdict("Capture approved. Sent for final check.");
        return;
      }

      // direct (REVIEWING) and final (REVIEWED): the admin's browser renders
      // the screens from the loaded draft and publishes the trace.
      const permission = await validateApprovePermissions(capture.id);
      if (!permission.ok) {
        throw new Error(permission.message);
      }
      const saveRes = await handleTraceSave(traceData, capture, (done, total) =>
        setSaveProgress({ done, total }),
      );
      if (!saveRes.ok) {
        throw new Error(saveRes.message);
      }
      const approveRes = await approveCapture(capture.id, approvalSummary());
      if (!approveRes.ok) {
        throw new Error(approveRes.message);
      }
      await revalidateCaptureCaches();
      await navigateAfterVerdict(
        mode === "final" ? "Capture published." : "Capture approved.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setSaveProgress(null);
      setIsSubmitting(false);
    }
  }, [
    approvalSummary,
    approveBlockedReason,
    capture,
    draftVersion,
    isSubmitting,
    mode,
    navigateAfterVerdict,
    reviewMetrics,
    traceData,
  ]);

  const handleDeny = useCallback(async () => {
    if (!capture || isSubmitting || mode === "none") {
      return;
    }
    if (denyBlockedReason) {
      toast.error(denyBlockedReason);
      return;
    }
    const screens = traceData?.screens ?? [];

    try {
      setIsSubmitting(true);
      const feedback = serializeReviewFeedbackState({ feedbackState, screens });
      // Serializing flattens the reviewer's issue picks into prose for the
      // worker. This preserves them as structured data for the review log.
      const summary = summarizeReviewVerdict({
        feedbackState,
        screenCount: screens.length,
      });
      const feedbackFields = {
        annotateFeedback: feedback.annotateFeedback,
        redactFeedback: feedback.redactFeedback,
        summarizeFeedback: feedback.summarizeFeedback,
      };

      const res =
        mode === "final"
          ? await finalDeny(capture.id, feedbackFields, summary)
          : await sendBack(
              capture.id,
              feedbackFields,
              summary,
              mode === "review" ? reviewMetrics() : undefined,
            );
      if (!res.ok) {
        throw new Error(res.message);
      }
      await revalidateCaptureCaches();
      await navigateAfterVerdict(
        mode === "final" ? "Capture denied." : "Capture sent back.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    capture,
    denyBlockedReason,
    feedbackState,
    isSubmitting,
    mode,
    navigateAfterVerdict,
    reviewMetrics,
    traceData,
  ]);

  const handleSkip = useCallback(async () => {
    if (!capture || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await navigateAfterVerdict(
        "Capture skipped.",
        "No later captures found.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [capture, isSubmitting, navigateAfterVerdict]);

  const hotkeyOptions = {
    enabled: enabled && !isSubmitting,
    enableOnFormTags: false,
    enableOnContentEditable: false,
    ignoreEventWhen: (event: KeyboardEvent) => event.repeat,
    preventDefault: true,
  };

  useHotkeys(
    "ctrl+shift+a",
    (event) => {
      event.preventDefault();
      // No Approve without a draft; the bar hides it too.
      if (draftVersion) void handleApprove();
    },
    hotkeyOptions,
    [handleApprove, draftVersion, mode, enabled, isSubmitting],
  );

  useHotkeys(
    "ctrl+shift+d",
    (event) => {
      event.preventDefault();
      void handleDeny();
    },
    hotkeyOptions,
    [handleDeny, enabled, isSubmitting],
  );

  useHotkeys(
    "ctrl+shift+e",
    (event) => {
      event.preventDefault();
      if (editHref && canEditInMode(mode)) router.push(editHref);
    },
    hotkeyOptions,
    [editHref, mode, router, enabled, isSubmitting],
  );

  useHotkeys(
    "ctrl+shift+s",
    (event) => {
      event.preventDefault();
      void handleSkip();
    },
    hotkeyOptions,
    [handleSkip, enabled, isSubmitting],
  );

  return {
    isSubmitting,
    saveProgress,
    handleApprove,
    handleDeny,
    handleSkip,
  };
}
