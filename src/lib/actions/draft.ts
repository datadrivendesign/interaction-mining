"use server";

import { CaptureStatus } from "@prisma/client";
import { ActionPayload } from "@/lib/actions/types";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, isReviewer } from "@/lib/auth/roles";
import { OWNER_EDITABLE_STATUSES } from "@/lib/actions/capture-internal";
import {
  claimedDraftIs,
  draftKey,
  getCurrentDraftVersion,
} from "@/lib/actions/review-internal";
import { putJson } from "@/lib/aws/s3/server-internal";
import {
  draftVersionSchema,
  nextDraftVersion,
  objectIdSchema,
} from "@/lib/aws/s3/upload-purpose";
import { DraftTraceSchema } from "@/app/(signed-in)/capture/[captureId]/edit/components/types";

/** Drafts hold no images; real ones are a few KB. */
const MAX_DRAFT_BYTES = 5 * 1024 * 1024;

const NEWER_DRAFT_MESSAGE =
  "Someone saved a newer version of this capture. Reload the page to see it, then make your change again.";

type Fail = { ok: false; message: string; data: null };
const denied = (message: string): Fail => ({ ok: false, message, data: null });

/**
 * Saves a capture's draft. The only way drafts are written: browsers cannot
 * upload them directly.
 *
 * Who may save is the old upload rule: the owner while they hold the pen
 * (CREATED / PROCESSING), a reviewer while the capture is REVIEWING, an admin
 * at any time.
 *
 * `baseVersion` is the draft the page loaded (null if none). Staff saves are
 * refused when it is no longer the newest, so a fix is never made on top of a
 * version the person has not seen. The owner's own saves skip that check:
 * nobody else edits while they hold the pen, and a second tab must not lose
 * their work.
 *
 * The server picks the new version from its clock (always after the newest),
 * claims it on the capture with a conditional write, and only then uploads
 * the file. Of two saves at once, one claim wins; the other is refused before
 * it writes anything.
 */
export async function saveCaptureDraft(
  captureId: unknown,
  draft: unknown,
  baseVersion: unknown,
): Promise<ActionPayload<{ version: string }>> {
  const id = objectIdSchema.safeParse(captureId);
  const base = draftVersionSchema.nullable().safeParse(baseVersion);
  if (!id.success || !base.success) {
    return denied("Invalid draft save.");
  }
  const parsed = DraftTraceSchema.safeParse(draft);
  if (!parsed.success) {
    return denied("The draft is not in the expected format.");
  }
  const body = JSON.stringify(parsed.data);
  if (body.length > MAX_DRAFT_BYTES) {
    return denied("The draft is too large to save.");
  }

  const session = await auth();
  if (!session?.user?.id) {
    return denied("Unauthorized");
  }

  try {
    const capture = await prisma.capture.findUnique({
      where: { id: id.data },
      select: { userId: true, status: true, draftVersion: true },
    });
    if (!capture) {
      return denied("Not found.");
    }
    const isOwnerWithPen =
      capture.userId === session.user.id &&
      OWNER_EDITABLE_STATUSES.includes(capture.status);
    const mayEdit =
      isAdmin(session) ||
      isOwnerWithPen ||
      (capture.status === CaptureStatus.REVIEWING && isReviewer(session));
    if (!mayEdit) {
      return denied("Not found.");
    }

    const claimed = capture.draftVersion ?? null;
    const current = await getCurrentDraftVersion(id.data, claimed);
    if (!isOwnerWithPen && base.data !== current) {
      return denied(NEWER_DRAFT_MESSAGE);
    }

    const version = nextDraftVersion(current, Date.now());
    // Staff claims are conditional on the version read above. The owner's are
    // not (two of their own tabs: the later save wins, as before), but still
    // require the status, so a save racing their Finish cannot land in review.
    const claim = await prisma.capture.updateMany({
      where: {
        id: id.data,
        status: capture.status,
        ...(isOwnerWithPen ? {} : claimedDraftIs(claimed)),
      },
      data: { draftVersion: version },
    });
    if (claim.count !== 1) {
      return denied(NEWER_DRAFT_MESSAGE);
    }

    try {
      await putJson(draftKey(id.data, version), body);
    } catch (err) {
      // Give the claim back, unless another save has claimed since.
      await prisma.capture.updateMany({
        where: { id: id.data, draftVersion: version },
        data: claimed ? { draftVersion: claimed } : { draftVersion: null },
      });
      throw err;
    }

    return { ok: true, message: "Draft saved.", data: { version } };
  } catch (err) {
    console.error("Failed to save draft:", err);
    return denied("Could not save the draft. Try again.");
  }
}
