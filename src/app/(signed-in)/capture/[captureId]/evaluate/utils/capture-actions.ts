"use server";

import {
  CaptureStatus,
  Prisma,
  ReviewStage,
  ReviewVerdict,
} from "@prisma/client";
import { z } from "zod";
import { ActionPayload } from "@/lib/actions/types";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REVIEWING_CAPTURE_ORDER_BY } from "@/app/(signed-in)/admin/util";
import { isAdmin, isReviewer } from "@/lib/auth/roles";
import {
  draftVersionSchema,
  objectIdSchema,
} from "@/lib/aws/s3/upload-purpose";
import {
  claimedDraftIs,
  FINAL_EDIT_KIND,
  getCurrentDraftVersion,
  getDraftCompletenessIssues,
  markReviewerApprovalOverturned,
  recordCaptureReview,
  reviewMetricsSchema,
  reviewSummarySchema,
} from "@/lib/actions/review-internal";

/*
 * Verdict actions for the two-stage review:
 *
 *   REVIEWING ──reviewerApprove──► REVIEWED ──approveCapture──► APPROVED
 *       │                              │
 *       └──sendBack──► PROCESSING ◄────┘ finalDeny
 *
 * The admin reviews every capture before it is published, so
 * the final Approve runs in the admin's browser: it renders the screens from
 * the draft, builds the trace, then calls `approveCapture`. The admin may
 * also approve a REVIEWING capture directly the same way.
 *
 * Every action takes ids, validates them, re-reads the capture and checks its
 * status server-side. Status writes are conditional on the status the check
 * saw, so two people acting on one capture at once cannot both win.
 */

/** Statuses the admin's Approve publishes from. */
const ADMIN_APPROVABLE: readonly CaptureStatus[] = [
  CaptureStatus.REVIEWING,
  CaptureStatus.REVIEWED,
];

const feedbackText = z.string().max(20000);

const feedbackSchema = z
  .object({
    annotateFeedback: feedbackText,
    redactFeedback: feedbackText,
    summarizeFeedback: feedbackText,
  })
  .strict();

type Fail = { ok: false; message: string; data: null };
const denied = (message: string): Fail => ({ ok: false, message, data: null });

/** Moves a capture from one status to another only if it is still in `from`. */
async function transition(
  captureId: string,
  from: CaptureStatus,
  data: Prisma.CaptureUpdateManyMutationInput,
): Promise<boolean> {
  const res = await prisma.capture.updateMany({
    where: { id: captureId, status: from },
    data,
  });
  return res.count === 1;
}

/**
 * Why a draft cannot be approved, or null: the person must have seen the
 * newest version (`version`, from their page), and it must pass the same
 * completeness checks the browser runs. Throws on S3 errors.
 */
async function checkApprovableDraft(
  captureId: string,
  claimed: string | null,
  version: string,
  takenOverAt: Date | null,
): Promise<string | null> {
  if (
    (await getCurrentDraftVersion(captureId, claimed, takenOverAt)) !== version
  ) {
    return "The draft changed. Reload the page and check it again.";
  }
  const issues = await getDraftCompletenessIssues(captureId, version);
  return issues.length > 0 ? `Can't approve yet. ${issues.join(" ")}` : null;
}

function errorMessage(err: unknown, fallback: string): string {
  // Prisma and S3 messages can carry internals; log them, show the fallback.
  console.error(fallback, err);
  return fallback;
}

// ---------------------------------------------------------------------------
// Admin approval (REVIEWING or REVIEWED → APPROVED, trace built in the browser)
// ---------------------------------------------------------------------------

/**
 * Pre-flight before the browser builds a trace: admin, the capture is still
 * waiting for a verdict, `version` (the draft the admin's page loaded) is
 * still the newest, and that draft passes the completeness checks. Checked
 * first so a stale or unfinished page does not create a trace.
 */
export async function validateApprovePermissions(
  captureId: unknown,
  version: unknown,
): Promise<ActionPayload<null>> {
  const id = objectIdSchema.safeParse(captureId);
  const v = draftVersionSchema.safeParse(version);
  if (!id.success || !v.success) {
    return denied("Invalid approve request.");
  }
  const session = await auth();
  if (!session?.user) {
    return denied("Unauthorized");
  }
  if (!isAdmin(session)) {
    return denied("Only admins can approve captures");
  }
  try {
    const capture = await prisma.capture.findUnique({
      where: { id: id.data },
      select: { status: true, draftVersion: true, takenOverAt: true },
    });
    if (!capture || !ADMIN_APPROVABLE.includes(capture.status)) {
      return denied("Capture is no longer waiting for review.");
    }
    const draftProblem = await checkApprovableDraft(
      id.data,
      capture.draftVersion ?? null,
      v.data,
      capture.takenOverAt,
    );
    if (draftProblem) return denied(draftProblem);
    return { ok: true, message: "Auth check passed", data: null };
  } catch (err) {
    return denied(errorMessage(err, "Failed to check the capture."));
  }
}

/**
 * Marks a REVIEWING or REVIEWED capture approved after the browser built its
 * trace, and logs a FINAL approval. Admin only.
 */
export async function approveCapture(
  captureId: unknown,
  summary: unknown,
): Promise<ActionPayload<null>> {
  const id = objectIdSchema.safeParse(captureId);
  const parsedSummary = reviewSummarySchema.safeParse(summary);
  if (!id.success || !parsedSummary.success) {
    return denied("Invalid approve request.");
  }
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session)) {
    return denied("Only admins can approve captures");
  }

  try {
    const capture = await prisma.capture.findUnique({
      where: { id: id.data },
      select: {
        userId: true,
        status: true,
        stagedDraftVersion: true,
        draftVersion: true,
        takenOverAt: true,
      },
    });
    // At the final check, a newer draft than the reviewer approved means the
    // admin edited it before publishing. Read before the status moves.
    const editedAtFinal =
      capture?.status === CaptureStatus.REVIEWED &&
      (await getCurrentDraftVersion(
        id.data,
        capture.draftVersion ?? null,
        capture.takenOverAt,
      )) !== capture.stagedDraftVersion;
    const moved =
      capture &&
      ADMIN_APPROVABLE.includes(capture.status) &&
      (await transition(id.data, capture.status, {
        status: CaptureStatus.APPROVED,
      }));
    if (!moved) {
      return denied("Capture is no longer waiting for review.");
    }
    await recordCaptureReview({
      captureId: id.data,
      reviewerId: session.user.id,
      verdict: ReviewVerdict.APPROVED,
      stage: ReviewStage.FINAL,
      selfReview: capture.userId === session.user.id,
      summary: parsedSummary.data,
      fixedKinds: editedAtFinal ? [FINAL_EDIT_KIND] : [],
    });
    return { ok: true, message: "Capture approved.", data: null };
  } catch (err) {
    return denied(errorMessage(err, "Failed to approve capture."));
  }
}

// ---------------------------------------------------------------------------
// Reviewer stage (REVIEWING)
// ---------------------------------------------------------------------------

/**
 * Reviewer approval: REVIEWING → REVIEWED, waiting for the admin's final
 * check. `version` is the draft the reviewer's page loaded; it must still be
 * the newest, and it is kept on the capture (`stagedDraftVersion`) as the
 * version the reviewer signed off on.
 */
export async function reviewerApprove(
  captureId: unknown,
  version: unknown,
  metrics: unknown,
  summary: unknown,
): Promise<ActionPayload<null>> {
  const id = objectIdSchema.safeParse(captureId);
  const v = draftVersionSchema.safeParse(version);
  const m = reviewMetricsSchema.safeParse(metrics);
  const s = reviewSummarySchema.safeParse(summary);
  if (!id.success || !v.success || !m.success || !s.success) {
    return denied("Invalid approve request.");
  }
  const session = await auth();
  if (!session?.user?.id || !isReviewer(session)) {
    return denied("Only reviewers can approve captures.");
  }

  try {
    const capture = await prisma.capture.findUnique({
      where: { id: id.data },
      select: {
        userId: true,
        status: true,
        draftVersion: true,
        takenOverAt: true,
      },
    });
    if (!capture || capture.status !== CaptureStatus.REVIEWING) {
      return denied("Capture is no longer waiting for review.");
    }

    const claimed = capture.draftVersion ?? null;
    const draftProblem = await checkApprovableDraft(
      id.data,
      claimed,
      v.data,
      capture.takenOverAt,
    );
    if (draftProblem) return denied(draftProblem);

    // Conditional on the claimed draft version as well as the status, so a
    // fix saved while this approval runs makes it fail instead of slipping in
    // unseen.
    const moved = await prisma.capture.updateMany({
      where: {
        id: id.data,
        status: CaptureStatus.REVIEWING,
        ...claimedDraftIs(claimed),
      },
      data: {
        status: CaptureStatus.REVIEWED,
        stagedDraftVersion: v.data,
      },
    });
    if (moved.count !== 1) {
      return denied(
        "The capture changed while approving. Reload the page and check it again.",
      );
    }
    await recordCaptureReview({
      captureId: id.data,
      reviewerId: session.user.id,
      verdict: ReviewVerdict.APPROVED,
      stage: ReviewStage.REVIEWER,
      selfReview: capture.userId === session.user.id,
      summary: s.data,
      metrics: m.data,
    });
    return { ok: true, message: "Capture approved.", data: null };
  } catch (err) {
    return denied(errorMessage(err, "Failed to approve capture."));
  }
}

/**
 * Sends a REVIEWING capture back to its owner with feedback. Reviewers and
 * admins; the log row's stage says which.
 */
export async function sendBack(
  captureId: unknown,
  feedback: unknown,
  summary: unknown,
  metrics?: unknown,
): Promise<ActionPayload<null>> {
  const id = objectIdSchema.safeParse(captureId);
  const f = feedbackSchema.safeParse(feedback);
  const s = reviewSummarySchema.safeParse(summary);
  const m = reviewMetricsSchema.optional().safeParse(metrics);
  if (!id.success || !f.success || !s.success || !m.success) {
    return denied("Invalid send back request.");
  }
  const session = await auth();
  if (!session?.user?.id || !isReviewer(session)) {
    return denied("Only reviewers can send captures back.");
  }

  try {
    const capture = await prisma.capture.findUnique({
      where: { id: id.data },
      select: { userId: true },
    });
    const moved =
      capture &&
      (await transition(id.data, CaptureStatus.REVIEWING, {
        status: CaptureStatus.PROCESSING,
        stagedDraftVersion: null,
        ...f.data,
      }));
    if (!moved) {
      return denied("Capture is no longer waiting for review.");
    }
    await recordCaptureReview({
      captureId: id.data,
      reviewerId: session.user.id,
      verdict: ReviewVerdict.REJECTED,
      stage: isAdmin(session) ? ReviewStage.FINAL : ReviewStage.REVIEWER,
      selfReview: capture.userId === session.user.id,
      summary: s.data,
      metrics: m.data,
    });
    return { ok: true, message: "Capture sent back.", data: null };
  } catch (err) {
    return denied(errorMessage(err, "Failed to send capture back."));
  }
}

/** Marks a take-over in the review log, so it can be counted apart. */
const TAKE_OVER_ISSUE_ID = "taken_over_to_rerecord";

/**
 * A reviewer takes a REVIEWING capture over to record the task again, for a
 * wrong or missing recording whose worker cannot redo it. The capture becomes
 * the reviewer's (`userId`), goes back to CREATED for a new upload, and keeps
 * who recorded it first (`originalUserId`, never overwritten).
 *
 * Nothing in S3 is deleted: the old video, screens and drafts stay (unless a
 * new upload reuses a file name), and every listing hides files written before
 * `takenOverAt`. Conditional on REVIEWING, so it cannot race another verdict.
 * A fix claimed just before still uploads, but its draft name predates the
 * take-over, so it stays hidden; saves from pages loaded before the take-over
 * are refused (`saveCaptureDraft`).
 */
export async function takeOverCapture(
  captureId: unknown,
): Promise<ActionPayload<null>> {
  const id = objectIdSchema.safeParse(captureId);
  if (!id.success) {
    return denied("Invalid request.");
  }
  const session = await auth();
  if (!session?.user?.id || !isReviewer(session)) {
    return denied("Only reviewers can record a capture again.");
  }

  try {
    const capture = await prisma.capture.findUnique({
      where: { id: id.data },
      select: { userId: true, originalUserId: true },
    });
    const moved =
      capture &&
      (await prisma.capture.updateMany({
        where: { id: id.data, status: CaptureStatus.REVIEWING },
        data: {
          status: CaptureStatus.CREATED,
          userId: session.user.id,
          originalUserId: capture.originalUserId ?? capture.userId,
          takenOverById: session.user.id,
          takenOverAt: new Date(),
          draftVersion: null,
          stagedDraftVersion: null,
          annotateFeedback: "",
          redactFeedback: "",
          summarizeFeedback: "",
        },
      }));
    if (!moved || moved.count !== 1) {
      return denied("This capture is no longer waiting for review.");
    }
    await recordCaptureReview({
      captureId: id.data,
      reviewerId: session.user.id,
      verdict: ReviewVerdict.REJECTED,
      stage: isAdmin(session) ? ReviewStage.FINAL : ReviewStage.REVIEWER,
      selfReview: capture.userId === session.user.id,
      summary: {
        issueIds: [TAKE_OVER_ISSUE_ID],
        issueCategories: ["recording"],
        destinations: [],
        screenIssueCount: 0,
        flowIssueCount: 1,
        screenCount: 0,
      },
    });
    return { ok: true, message: "The capture is yours now.", data: null };
  } catch (err) {
    return denied(errorMessage(err, "Could not take over the capture."));
  }
}

// ---------------------------------------------------------------------------
// Final check (REVIEWED, admin only)
// ---------------------------------------------------------------------------

/**
 * Admin denies a REVIEWED capture: back to the owner with feedback. The
 * reviewer's approval for this round is marked overturned.
 */
export async function finalDeny(
  captureId: unknown,
  feedback: unknown,
  summary: unknown,
): Promise<ActionPayload<null>> {
  const id = objectIdSchema.safeParse(captureId);
  const f = feedbackSchema.safeParse(feedback);
  const s = reviewSummarySchema.safeParse(summary);
  if (!id.success || !f.success || !s.success) {
    return denied("Invalid deny request.");
  }
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session)) {
    return denied("Only admins can deny at final check.");
  }

  try {
    const capture = await prisma.capture.findUnique({
      where: { id: id.data },
      select: { userId: true },
    });
    const moved =
      capture &&
      (await transition(id.data, CaptureStatus.REVIEWED, {
        status: CaptureStatus.PROCESSING,
        stagedDraftVersion: null,
        ...f.data,
      }));
    if (!moved) {
      return denied("Capture is no longer waiting for final check.");
    }
    // Before the new REJECTED row, so "this round" still means this round.
    await markReviewerApprovalOverturned(id.data);
    await recordCaptureReview({
      captureId: id.data,
      reviewerId: session.user.id,
      verdict: ReviewVerdict.REJECTED,
      stage: ReviewStage.FINAL,
      selfReview: capture.userId === session.user.id,
      summary: s.data,
    });
    return { ok: true, message: "Capture denied.", data: null };
  } catch (err) {
    return denied(errorMessage(err, "Failed to deny capture."));
  }
}

// ---------------------------------------------------------------------------
// Queue navigation
// ---------------------------------------------------------------------------

const queueStatusSchema = z.enum([
  CaptureStatus.REVIEWING,
  CaptureStatus.REVIEWED,
]);

/**
 * The next capture after `currentCaptureId` in the same queue. Reviewers walk
 * REVIEWING; the REVIEWED queue is the admin's.
 */
export async function getNextReviewingCaptureId(
  currentCaptureId: unknown,
  status: unknown = CaptureStatus.REVIEWING,
): Promise<ActionPayload<string | null>> {
  const id = objectIdSchema.safeParse(currentCaptureId);
  const queue = queueStatusSchema.safeParse(status);
  if (!id.success || !queue.success) {
    return denied("Invalid capture ID.");
  }

  const session = await auth();
  if (!session?.user || !isReviewer(session)) {
    return denied("Only reviewers can review captures");
  }
  if (queue.data === CaptureStatus.REVIEWED && !isAdmin(session)) {
    return denied("Only admins can review captures waiting for final check");
  }

  try {
    const nextCapture = await prisma.capture.findFirst({
      where: {
        status: queue.data,
        id: { lt: id.data },
      },
      orderBy: REVIEWING_CAPTURE_ORDER_BY,
      select: { id: true },
    });

    return {
      ok: true,
      message: nextCapture
        ? "Next capture found."
        : "No additional captures found.",
      data: nextCapture?.id ?? null,
    };
  } catch (err) {
    return denied(errorMessage(err, "Failed to fetch next capture"));
  }
}
