import "server-only";

import { Capture, CaptureStatus, Prisma, Role } from "@prisma/client";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

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
 * Loads a capture if the session may act on it: the owner, or an ADMIN.
 * Returns `null` both when the capture does not exist and when access is
 * denied, so callers cannot probe which ids exist.
 *
 * Phase 1 adds REVIEWER-while-REVIEWING here, and only here.
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
  if (session.user.role === Role.ADMIN) {
    return capture;
  }
  return capture.userId === session.user.id ? capture : null;
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
