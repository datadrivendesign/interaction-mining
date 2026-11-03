import "server-only";

import { Capture, CaptureStatus, Prisma } from "@prisma/client";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, isReviewer } from "@/lib/auth/roles";

/**
 * Server-only capture helpers. Nothing here is a server action: `capture.ts`
 * is a `"use server"` module, so every export there is a public endpoint, and
 * these two must not be.
 */

/** Statuses in which the owner still holds the pen and may change things. */
export const OWNER_EDITABLE_STATUSES: readonly CaptureStatus[] = [
  CaptureStatus.CREATED,
  CaptureStatus.PROCESSING,
];

/**
 * Statuses in which a REVIEWER may open a capture they do not own: while it is
 * in first-pass review, and read-only while it waits for the final check.
 */
export const REVIEWER_OPEN_STATUSES: readonly CaptureStatus[] = [
  CaptureStatus.REVIEWING,
  CaptureStatus.REVIEWED,
];

export function reviewerMayOpen(
  session: Session | null | undefined,
  status: CaptureStatus,
): boolean {
  return isReviewer(session) && REVIEWER_OPEN_STATUSES.includes(status);
}

/**
 * Loads a capture if the session may act on it: the owner, an ADMIN, or a
 * REVIEWER while the capture is REVIEWING / REVIEWED. Returns `null` both when
 * the capture does not exist and when access is denied, so callers cannot
 * probe which ids exist. This is the one place that rule lives.
 */
export async function getCaptureForAccess(
  captureId: string,
  session: Session | null,
): Promise<Capture | null> {
  if (!session?.user?.id) {
    return null;
  }
  const capture = await prisma.capture.findUnique({ where: { id: captureId } });
  if (!capture) {
    return null;
  }
  if (isAdmin(session) || capture.userId === session.user.id) {
    return capture;
  }
  return reviewerMayOpen(session, capture.status) ? capture : null;
}

/**
 * Unchecked capture update for trusted server-side callers (capture layout
 * `traceId` write, admin approve/deny, finalize). The browser-facing
 * `updateCapture` action only lets owners move between the statuses they are
 * allowed to; every other write must come through here, from code that has
 * already checked the role.
 */
export async function updateCaptureRecord(
  id: string,
  data: Prisma.CaptureUpdateInput,
): Promise<Capture> {
  return prisma.capture.update({ where: { id }, data });
}
