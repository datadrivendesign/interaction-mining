"use client";

import { Capture } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { revalidateCaptureCaches } from "@/lib/actions";
import { TraceFormData } from "../../../edit/components/types";
import { handleTraceSave } from "../../../edit/util/export";
import {
  approveCapture,
  denyCapture,
  getNextReviewingCaptureId,
  validateApprovePermissions,
} from "../../utils/capture-actions";
import {
  ReviewFeedbackState,
  serializeReviewFeedbackState,
} from "../../utils/review-feedback";
import { summarizeReviewVerdict } from "../../utils/review-verdict-summary";

export function useReviewVerdictActions({
  capture,
  traceData,
  feedbackState,
  isAdmin,
}: {
  capture?: Capture | null;
  traceData?: TraceFormData;
  feedbackState: ReviewFeedbackState;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigateAfterVerdict = useCallback(
    async (
      successMessage: string,
      emptyQueueMessage = "Review queue complete.",
    ) => {
      if (!capture) {
        router.push("/admin/tasks");
        return;
      }

      const nextCaptureRes = await getNextReviewingCaptureId(capture.id);
      if (!nextCaptureRes.ok) {
        console.error(
          "Failed to fetch next reviewing capture:",
          nextCaptureRes.message,
        );
        toast.success(`${successMessage} Returning to task list.`);
        router.push("/admin/tasks");
        return;
      }

      if (nextCaptureRes.data) {
        toast.success(`${successMessage} Loading next capture...`);
        router.push(`/capture/${nextCaptureRes.data}/evaluate`);
        return;
      }

      toast.success(`${successMessage} ${emptyQueueMessage}`);
      router.push("/admin/tasks");
    },
    [capture, router],
  );

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
      // Logged as well as applied, so the log carries the denominator a reject
      // rate needs.
      //
      // Issue fields are empty deliberately: an approval means nothing was left
      // to send back. Summarizing the live state here recorded the previous
      // rejection's comments, which reopening a bounced capture loads back in, so
      // the same issues landed on both the rejection and the approval that
      // cleared them. `screenCount` stays — it describes the trace, not the
      // feedback.
      const approveCaptureRes = await approveCapture(capture, {
        issueIds: [],
        issueCategories: [],
        destinations: [],
        screenIssueCount: 0,
        flowIssueCount: 0,
        screenCount: traceData.screens.length,
      });
      if (!approveCaptureRes.ok) {
        throw new Error(approveCaptureRes.message);
      }
      await revalidateCaptureCaches();
      await navigateAfterVerdict("Capture approved.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [capture, feedbackState, navigateAfterVerdict, traceData]);

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
        // Serializing flattens the reviewer's issue picks into prose for the
        // worker. This preserves them as structured data for the review log.
        summarizeReviewVerdict({
          feedbackState,
          screenCount: traceData.screens.length,
        }),
      );
      if (!denyRes.ok) {
        throw new Error(denyRes.message);
      }
      await revalidateCaptureCaches();
      await navigateAfterVerdict("Capture denied.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [capture, feedbackState, navigateAfterVerdict, traceData]);

  const handleSkip = useCallback(async () => {
    if (!capture) {
      return;
    }

    try {
      setIsSubmitting(true);
      await navigateAfterVerdict(
        "Capture skipped.",
        "No later reviewing captures found.",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [capture, navigateAfterVerdict]);

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
    "ctrl+shift+s",
    (event) => {
      event.preventDefault();
      void handleSkip();
    },
    {
      enabled: isAdmin && !isSubmitting,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [handleSkip, isAdmin, isSubmitting],
  );

  return {
    isSubmitting,
    handleApprove,
    handleDeny,
    handleSkip,
  };
}
