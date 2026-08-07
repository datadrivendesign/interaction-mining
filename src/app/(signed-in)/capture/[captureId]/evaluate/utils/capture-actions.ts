"use server";

import { Capture, CaptureStatus, ReviewVerdict, Role } from "@prisma/client";
import { updateCapture } from "@/lib/actions";
import { ActionPayload } from "@/lib/actions/types";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidObjectId } from "mongoose";
import { REVIEWING_CAPTURE_ORDER_BY } from "@/app/(signed-in)/admin/util";
import { ReviewVerdictSummary } from "./review-verdict-summary";

/**
 * Appends a row to the review log.
 *
 * Deliberately best-effort: a verdict that reached the database must not be
 * reported as failed because its analytics row did not, so failures here are
 * logged and swallowed. The log is derived data — a missing row costs one
 * sample, a rolled-back verdict costs a reviewer's work.
 *
 * @param captureId - Capture being reviewed.
 * @param reviewerId - Admin submitting the verdict, when the session carries one.
 * @param verdict - Approved or rejected.
 * @param summary - Structured issues cited, absent on approvals.
 */
async function recordCaptureReview({
  captureId,
  reviewerId,
  verdict,
  summary,
}: {
  captureId: string;
  reviewerId?: string;
  verdict: ReviewVerdict;
  summary?: ReviewVerdictSummary;
}): Promise<void> {
  try {
    // Attempt number is derived rather than stored on Capture, so no existing
    // capture document needs backfilling. Captures reviewed before this log
    // existed simply start at 1.
    const priorReviews = await prisma.captureReview.count({
      where: { captureId },
    });

    await prisma.captureReview.create({
      data: {
        captureId,
        reviewerId,
        verdict,
        attempt: priorReviews + 1,
        issueIds: summary?.issueIds ?? [],
        issueCategories: summary?.issueCategories ?? [],
        destinations: summary?.destinations ?? [],
        screenIssueCount: summary?.screenIssueCount ?? 0,
        flowIssueCount: summary?.flowIssueCount ?? 0,
        screenCount: summary?.screenCount,
      },
    });
  } catch (err) {
    console.error("Failed to record capture review:", err);
  }
}

export async function validateApprovePermissions(): Promise<
  ActionPayload<null>
> {
  // server side auth check
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Unauthorized", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Only admins can approve captures",
      data: null,
    };
  }
  return {
    ok: true,
    message: "Auth check passed",
    data: null,
  };
}

export async function denyCapture(
  capture: Capture,
  annotateFeedback: string,
  redactFeedback: string,
  summarizeFeedback: string,
  summary?: ReviewVerdictSummary,
): Promise<ActionPayload<null>> {
  // server side auth check
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Unauthorized", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Only admins can approve captures",
      data: null,
    };
  }
  // handle update logic
  try {
    const updateRes = await updateCapture(capture.id, {
      status: CaptureStatus.PROCESSING,
      annotateFeedback,
      redactFeedback,
      summarizeFeedback,
    });
    if (!updateRes.ok) {
      throw new Error(updateRes.message ?? "Failed to update capture");
    }
    // After the status write, so a failed denial never logs a rejection.
    await recordCaptureReview({
      captureId: capture.id,
      reviewerId: session.user.id,
      verdict: ReviewVerdict.REJECTED,
      summary,
    });
    return {
      ok: true,
      message: "Capture denied successfully",
      data: null,
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to update capture to denied status",
      data: null,
    };
  }
}

/**
 * Marks a capture approved and logs the verdict.
 *
 * Replaces a bare `updateCapture` call from the client. Approvals have to be
 * logged too: reject *rate* needs the denominator, and without approvals the log
 * can only answer how many rejections happened, not how often review rejects.
 *
 * @param capture - Capture being approved. Its trace should already be saved.
 * @param summary - Any issues the reviewer noted while still approving.
 */
export async function approveCapture(
  capture: Capture,
  summary?: ReviewVerdictSummary,
): Promise<ActionPayload<null>> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Unauthorized", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Only admins can approve captures",
      data: null,
    };
  }

  try {
    const updateRes = await updateCapture(capture.id, {
      status: CaptureStatus.APPROVED,
    });
    if (!updateRes.ok) {
      throw new Error(updateRes.message ?? "Failed to update capture");
    }
    await recordCaptureReview({
      captureId: capture.id,
      reviewerId: session.user.id,
      verdict: ReviewVerdict.APPROVED,
      summary,
    });
    return {
      ok: true,
      message: "Capture approved successfully",
      data: null,
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to update capture to approved status",
      data: null,
    };
  }
}

export async function getNextReviewingCaptureId(
  currentCaptureId: string,
): Promise<ActionPayload<string | null>> {
  if (!isValidObjectId(currentCaptureId)) {
    return {
      ok: false,
      message: "Invalid capture ID.",
      data: null,
    };
  }

  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Unauthorized", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Only admins can review captures",
      data: null,
    };
  }

  try {
    const nextCapture = await prisma.capture.findFirst({
      where: {
        status: CaptureStatus.REVIEWING,
        id: { lt: currentCaptureId },
      },
      orderBy: REVIEWING_CAPTURE_ORDER_BY,
      select: { id: true },
    });

    return {
      ok: true,
      message: nextCapture
        ? "Next reviewing capture found."
        : "No additional reviewing captures found.",
      data: nextCapture?.id ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to fetch next reviewing capture",
      data: null,
    };
  }
}
