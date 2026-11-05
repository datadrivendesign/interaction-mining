import "server-only";

/**
 * Server-only pieces of the two-stage review: the review log and the draft
 * version check. Nothing here checks the session; the actions in
 * `evaluate/utils/capture-actions.ts` do that and then call in. Keeping these
 * out of a `"use server"` module means none of them is a public endpoint.
 */

import { ReviewStage, ReviewVerdict } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { listKeys } from "@/lib/aws/s3/server-internal";
import {
  draftVersionFromKey,
  draftVersionTime,
} from "@/lib/aws/s3/upload-purpose";

// ---------------------------------------------------------------------------
// Review log
// ---------------------------------------------------------------------------

/** Structured issues cited with a verdict (see `review-verdict-summary.ts`). */
export const reviewSummarySchema = z
  .object({
    issueIds: z.array(z.string().max(100)).max(200),
    issueCategories: z.array(z.string().max(100)).max(200),
    destinations: z.array(z.string().max(100)).max(20),
    screenIssueCount: z.number().int().nonnegative().max(10000),
    flowIssueCount: z.number().int().nonnegative().max(10000),
    screenCount: z.number().int().nonnegative().max(10000),
  })
  .strict();

export type ReviewSummary = z.infer<typeof reviewSummarySchema>;

/** Reviewer-side measurements sent with a REVIEWER verdict. */
export const reviewMetricsSchema = z
  .object({
    // Capped at a day: a tab left open overnight is not a review duration.
    reviewDurationMs: z
      .number()
      .int()
      .nonnegative()
      .max(24 * 60 * 60 * 1000),
  })
  .strict();

export type ReviewMetrics = z.infer<typeof reviewMetricsSchema>;

/**
 * `fixedKinds` value on a FINAL approval when the admin changed the draft at
 * the final check, i.e. published something other than what the reviewer
 * approved. Phase 4 adds per-kind values from fix-in-place.
 */
export const FINAL_EDIT_KIND = "final-edit";

/**
 * Appends a row to the review log.
 *
 * Best-effort: a verdict that reached the database must not be reported as
 * failed because its log row did not, so failures are logged and swallowed.
 *
 * `attempt` counts prior REJECTED rows + 1, so a REVIEWER approval and the
 * admin's FINAL verdict on the same submission share an attempt number, and
 * each send-back starts the next one.
 */
export async function recordCaptureReview({
  captureId,
  reviewerId,
  verdict,
  stage,
  selfReview = false,
  summary,
  metrics,
  fixedKinds = [],
}: {
  captureId: string;
  reviewerId?: string;
  verdict: ReviewVerdict;
  stage: ReviewStage;
  selfReview?: boolean;
  summary?: ReviewSummary;
  metrics?: ReviewMetrics;
  fixedKinds?: string[];
}): Promise<void> {
  try {
    const priorRejections = await prisma.captureReview.count({
      where: { captureId, verdict: ReviewVerdict.REJECTED },
    });

    await prisma.captureReview.create({
      data: {
        captureId,
        reviewerId,
        verdict,
        stage,
        selfReview,
        attempt: priorRejections + 1,
        // FINAL_EDIT_KIND for an admin edit at the final check; per-kind
        // values come with fix-in-place (Phase 4).
        fixedKinds,
        reviewDurationMs: metrics?.reviewDurationMs,
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

/**
 * Marks the reviewer approval of the current round as overturned, after the
 * admin denies a REVIEWED capture. "Current round" is after the last REJECTED
 * row, so an approval from an earlier round is never touched. Best-effort.
 */
export async function markReviewerApprovalOverturned(
  captureId: string,
): Promise<void> {
  try {
    const lastRejection = await prisma.captureReview.findFirst({
      where: { captureId, verdict: ReviewVerdict.REJECTED },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const approval = await prisma.captureReview.findFirst({
      where: {
        captureId,
        stage: ReviewStage.REVIEWER,
        verdict: ReviewVerdict.APPROVED,
        ...(lastRejection
          ? { createdAt: { gt: lastRejection.createdAt } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (approval) {
      await prisma.captureReview.update({
        where: { id: approval.id },
        data: { overturned: true },
      });
    }
  } catch (err) {
    console.error("Failed to mark reviewer approval overturned:", err);
  }
}

// ---------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------

/**
 * The newest draft version of a capture (`draft-<ms>`), or null if it has
 * none. Same newest-timestamp rule the evaluate and edit pages use when they
 * load a draft. Throws on S3 errors.
 */
export async function getLatestDraftVersion(
  captureId: string,
): Promise<string | null> {
  const keys = await listKeys(`uploads/${captureId}/drafts/`);
  let latest: string | null = null;
  for (const key of keys) {
    const version = draftVersionFromKey(key);
    if (
      version &&
      (!latest || draftVersionTime(version) > draftVersionTime(latest))
    ) {
      latest = version;
    }
  }
  return latest;
}
