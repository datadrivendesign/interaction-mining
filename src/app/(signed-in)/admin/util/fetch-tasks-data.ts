"use server";

import { ActionPayload } from "@/lib/actions/types";
import { prisma } from "@/lib/prisma";
import { CaptureStatus, Prisma } from "@prisma/client";
import { isAdmin, isReviewer } from "@/lib/auth/roles";
import { CaptureAdminView, REVIEWING_CAPTURE_ORDER_BY } from "./types";
import { isValidObjectId } from "mongoose";
import type { Session } from "next-auth";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";

/**
 * The two review queues. Reviewers only see REVIEWING; the admin also has
 * REVIEWED (waiting for the final check).
 */
const taskStageSchema = z
  .enum([CaptureStatus.REVIEWING, CaptureStatus.REVIEWED])
  .default(CaptureStatus.REVIEWING);

/** The status to list, or null when the stage is invalid or not allowed. */
function queueStatusFor(
  session: Session,
  stage: unknown,
): CaptureStatus | null {
  const parsed = taskStageSchema.safeParse(stage);
  if (!parsed.success) {
    return null;
  }
  if (parsed.data === CaptureStatus.REVIEWED && !isAdmin(session)) {
    return null;
  }
  return parsed.data;
}

interface GetReviewingCapturesParams {
  limit: number;
  page: number;
  userIds?: string[];
  appIds?: string[];
  /** REVIEWING (default) or REVIEWED; REVIEWED is admin only. */
  stage?: CaptureStatus;
}

/**
 * Gets the captures in review for the admin panel with pagination capability.
 * @param limit - The number of captures to return per page.
 * @param page - The page number to return. Must be greater than 0.
 * @param userIds - The user IDs to filter by (optional).
 * @param appIds - The app IDs to filter by (optional).
 * @param stage - REVIEWING (default) or REVIEWED (admin only).
 * @returns ActionPayload<CaptureAdminView[]>
 */
export const getReviewingCaptures = async ({
  limit,
  page,
  userIds,
  appIds,
  stage,
}: GetReviewingCapturesParams): Promise<ActionPayload<CaptureAdminView[]>> => {
  // parameter validations
  if (page <= 0) {
    return {
      ok: false,
      message: "Page number must be greater than 0.",
      data: null,
    };
  }

  if (limit <= 0) {
    return { ok: false, message: "Limit must be greater than 0.", data: null };
  }

  if (userIds && userIds.some((id) => !isValidObjectId(id))) {
    return { ok: false, message: "Invalid user IDs provided.", data: null };
  }

  if (appIds && appIds.some((id) => !isValidObjectId(id))) {
    return { ok: false, message: "Invalid app IDs provided.", data: null };
  }
  // check if user is authenticated and admin
  const session = await requireAuth();

  if (!session) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  if (!isReviewer(session)) {
    return {
      ok: false,
      message: "Unauthorized: Only reviewers can view reviewing captures.",
      data: null,
    };
  }
  const status = queueStatusFor(session, stage);
  if (!status) {
    return { ok: false, message: "Invalid review stage.", data: null };
  }
  // get reviewing captures
  const captures = await prisma.capture.findMany({
    where: {
      status,
      ...(userIds && userIds.length > 0 ? { userId: { in: userIds } } : {}),
      ...(appIds && appIds.length > 0 ? { appId: { in: appIds } } : {}),
    },
    include: {
      task: true,
      app: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: REVIEWING_CAPTURE_ORDER_BY,
    take: limit,
    skip: (page - 1) * limit,
  });
  // return payloads
  if (!captures) {
    return { ok: false, message: "No captures found.", data: null };
  }

  // Reviewers see the queue but not who recorded each capture.
  const visible = isAdmin(session)
    ? captures
    : captures.map((capture) => ({
        ...capture,
        user: capture.user
          ? { id: capture.user.id, name: null, email: null }
          : null,
      }));

  return { ok: true, message: "Captures found.", data: visible };
};

/**
 * Gets the total number of captures in need of review
 * @param userIds - The user IDs to filter by (optional).
 * @param appIds - The app IDs to filter by (optional).
 * @returns ActionPayload<number>
 */
export const getReviewCapturesCount = async ({
  userIds,
  appIds,
  stage,
}: Omit<GetReviewingCapturesParams, "limit" | "page">): Promise<
  ActionPayload<number>
> => {
  // parameter validations
  if (userIds && userIds.some((id) => !isValidObjectId(id))) {
    return { ok: false, message: "Invalid user IDs provided.", data: null };
  }

  if (appIds && appIds.some((id) => !isValidObjectId(id))) {
    return { ok: false, message: "Invalid app IDs provided.", data: null };
  }
  // check if user is authenticated and admin
  const session = await requireAuth();
  if (!session) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  if (!isReviewer(session)) {
    return {
      ok: false,
      message: "Unauthorized: Only reviewers can view review captures count.",
      data: null,
    };
  }
  const status = queueStatusFor(session, stage);
  if (!status) {
    return { ok: false, message: "Invalid review stage.", data: null };
  }
  // get review captures count
  const count = await prisma.capture.count({
    where: {
      status,
      ...(userIds && userIds.length > 0 ? { userId: { in: userIds } } : {}),
      ...(appIds && appIds.length > 0 ? { appId: { in: appIds } } : {}),
    },
  });

  return { ok: true, message: "Review captures count found.", data: count };
};

interface GetAdminAppParams {
  id: string;
  packageName: string;
  metadata: {
    name: string;
  };
}

interface GetAdminUserParams {
  id: string;
  name: string | null;
  email: string | null;
}

/**
 * Gets the filter dropdown options for the admin panel (apps and users). Should only grab apps and users present in review captures.
 * @returns ActionPayload<{ apps: GetAdminAppParams[]; users: GetAdminUserParams[] }>
 */
export const getFilterOptionsForTasks = async (): Promise<
  ActionPayload<{ apps: GetAdminAppParams[]; users: GetAdminUserParams[] }>
> => {
  // check if user is authenticated and admin
  const session = await requireAuth();
  if (!session) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  if (!isReviewer(session)) {
    return {
      ok: false,
      message: "Unauthorized: Only reviewers can view filter options.",
      data: null,
    };
  }
  // The worker list (names, emails) is for admins; reviewers filter by app.
  const includeUsers = isAdmin(session);
  // Options cover every queue this user can open.
  const statuses: CaptureStatus[] = isAdmin(session)
    ? [CaptureStatus.REVIEWING, CaptureStatus.REVIEWED]
    : [CaptureStatus.REVIEWING];

  // get unique user IDs from reviewing captures
  let userIds = await prisma.capture.findMany({
    where: { status: { in: statuses } },
    select: { userId: true },
    distinct: ["userId"],
  });

  if (!userIds) {
    userIds = [];
  }

  // get unique app IDs from reviewing captures
  let appIds = await prisma.capture.findMany({
    where: { status: { in: statuses } },
    select: { appId: true },
    distinct: ["appId"],
  });

  if (!appIds) {
    appIds = [];
  }

  // fetch full user and app data
  const [users, apps] = await Promise.all([
    includeUsers
      ? prisma.user.findMany({
          where: { id: { in: userIds.map((u) => u.userId as string) } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
    prisma.app.findMany({
      where: { id: { in: appIds.map((a) => a.appId) } },
      select: {
        id: true,
        metadata: { select: { name: true } },
        packageName: true,
      },
    }),
  ]);

  return {
    ok: true,
    message: "Filter options found.",
    data: { users, apps },
  };
};
