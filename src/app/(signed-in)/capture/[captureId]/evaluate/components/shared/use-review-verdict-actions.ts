"use client";

import { Capture, CaptureStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { revalidateCaptureCaches, updateCapture } from "@/lib/actions";
import { TraceFormData } from "../../../edit/components/types";
import { handleTraceSave } from "../../../edit/util/export";
import {
  denyCapture,
  getNextReviewingCaptureId,
  validateApprovePermissions,
} from "../../utils/capture-actions";
import {
  ReviewFeedbackState,
  serializeReviewFeedbackState,
} from "../../utils/review-feedback";

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
      const updateRes = await updateCapture(capture.id, {
        status: CaptureStatus.APPROVED,
      });
      if (!updateRes.ok) {
        throw new Error(updateRes.message);
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
  }, [capture, navigateAfterVerdict, traceData]);

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
