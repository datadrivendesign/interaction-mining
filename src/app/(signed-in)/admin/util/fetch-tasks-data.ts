"use server";

import { ActionPayload } from "@/lib/actions/types";
import { prisma } from "@/lib/prisma";
import {
  CaptureStatus,
  Prisma,
  ReviewStage,
  ReviewVerdict,
} from "@prisma/client";
import { isAdmin, isReviewer } from "@/lib/auth/roles";
import {
  REVIEWING_CAPTURE_ORDER_BY,
  TASK_STAGES,
  TaskReviewInfo,
  TaskRow,
  TaskStage,
} from "./types";
import { isValidObjectId } from "mongoose";
import type { Session } from "next-auth";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";

/*
 * Review queues. Reviewers (and admins) list REVIEWING at /review/tasks; the
 * admin's /admin/tasks adds REVIEWED (final check) and SENT_BACK (PROCESSING
 * captures that have a rejection, i.e. waiting on the worker).
 */
const taskStageSchema = z.enum(TASK_STAGES).default("REVIEWING");

/** The stage to list, or null when it is invalid or not allowed. */
function allowedStage(session: Session, stage: unknown): TaskStage | null {
  const parsed = taskStageSchema.safeParse(stage);
  if (!parsed.success) {
    return null;
  }
  if (parsed.data !== "REVIEWING" && !isAdmin(session)) {
    return null;
  }
  return parsed.data;
}

/**
 * Capture filter for a stage. SENT_BACK starts from the review log (one
 * group per rejected capture) and then keeps the ones still with the worker,
 * instead of scanning every PROCESSING capture.
 */
async function stageWhere(stage: TaskStage): Promise<Prisma.CaptureWhereInput> {
  if (stage !== "SENT_BACK") {
    return { status: stage };
  }
  const rejected = await prisma.captureReview.groupBy({
    by: ["captureId"],
    where: { verdict: ReviewVerdict.REJECTED },
  });
  return {
    status: CaptureStatus.PROCESSING,
    id: { in: rejected.map((row) => row.captureId) },
  };
}

function filterWhere(
  userIds?: string[],
  appIds?: string[],
): Prisma.CaptureWhereInput {
  return {
    ...(userIds && userIds.length > 0 ? { userId: { in: userIds } } : {}),
    ...(appIds && appIds.length > 0 ? { appId: { in: appIds } } : {}),
  };
}

function validateFilters(userIds?: string[], appIds?: string[]) {
  if (userIds && userIds.some((id) => !isValidObjectId(id))) {
    return "Invalid user IDs provided.";
  }
  if (appIds && appIds.some((id) => !isValidObjectId(id))) {
    return "Invalid app IDs provided.";
  }
  return null;
}

/**
 * Review-log facts for one page of captures, from a single query over the
 * page's ids. `lastBy` is the reviewer behind the row this stage cares about
 * (REVIEWED: the reviewer who approved; SENT_BACK: who sent it back).
 */
async function reviewInfoFor(
  captureIds: string[],
  stage: TaskStage,
  includeNames: boolean,
): Promise<Map<string, TaskReviewInfo>> {
  const rows =
    captureIds.length === 0
      ? []
      : await prisma.captureReview.findMany({
          where: { captureId: { in: captureIds } },
          orderBy: { createdAt: "asc" },
          select: {
            captureId: true,
            verdict: true,
            stage: true,
            selfReview: true,
            reviewer: { select: { name: true, email: true } },
          },
        });

  const info = new Map<string, TaskReviewInfo>();
  for (const id of captureIds) {
    const mine = rows.filter((row) => row.captureId === id);
    const timesSentBack = mine.filter(
      (row) => row.verdict === ReviewVerdict.REJECTED,
    ).length;
    const relevant =
      stage === "REVIEWED"
        ? mine.findLast(
            (row) =>
              row.verdict === ReviewVerdict.APPROVED &&
              row.stage === ReviewStage.REVIEWER,
          )
        : stage === "SENT_BACK"
          ? mine.findLast((row) => row.verdict === ReviewVerdict.REJECTED)
          : undefined;
    info.set(id, {
      attempt: timesSentBack + 1,
      timesSentBack,
      lastBy:
        relevant && includeNames
          ? (relevant.reviewer?.name ?? relevant.reviewer?.email ?? "Unknown")
          : null,
      lastStage: relevant?.stage ?? null,
      selfReviewed: relevant?.selfReview ?? false,
    });
  }
  return info;
}

interface GetReviewingCapturesParams {
  limit: number;
  page: number;
  userIds?: string[];
  appIds?: string[];
  /** REVIEWING (default); REVIEWED and SENT_BACK are admin only. */
  stage?: TaskStage;
}

/**
 * Gets one page of a review queue.
 * @param limit - The number of captures to return per page.
 * @param page - The page number to return. Must be greater than 0.
 * @param userIds - The user IDs to filter by (optional).
 * @param appIds - The app IDs to filter by (optional).
 * @param stage - REVIEWING (default), REVIEWED or SENT_BACK (admin only).
 * @returns ActionPayload<TaskRow[]>
 */
export const getReviewingCaptures = async ({
  limit,
  page,
  userIds,
  appIds,
  stage,
}: GetReviewingCapturesParams): Promise<ActionPayload<TaskRow[]>> => {
  if (!Number.isInteger(page) || page <= 0) {
    return {
      ok: false,
      message: "Page number must be greater than 0.",
      data: null,
    };
  }
  if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
    return {
      ok: false,
      message: "Limit must be between 1 and 100.",
      data: null,
    };
  }
  const filterError = validateFilters(userIds, appIds);
  if (filterError) {
    return { ok: false, message: filterError, data: null };
  }

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
  const queue = allowedStage(session, stage);
  if (!queue) {
    return { ok: false, message: "Invalid review stage.", data: null };
  }

  try {
    const captures = await prisma.capture.findMany({
      where: {
        ...(await stageWhere(queue)),
        ...filterWhere(userIds, appIds),
      },
      include: {
        task: true,
        app: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: REVIEWING_CAPTURE_ORDER_BY,
      take: limit,
      skip: (page - 1) * limit,
    });

    const admin = isAdmin(session);
    const reviews = await reviewInfoFor(
      captures.map((capture) => capture.id),
      queue,
      admin,
    );

    const rows: TaskRow[] = captures.map((capture) => ({
      ...capture,
      // Reviewers see the queue but not who recorded each capture.
      user:
        admin || !capture.user
          ? capture.user
          : { id: capture.user.id, name: null, email: null },
      review: reviews.get(capture.id)!,
      isOwn: capture.userId === session.user.id,
    }));

    return { ok: true, message: "Captures found.", data: rows };
  } catch (err) {
    console.error("Failed to fetch review queue:", err);
    return { ok: false, message: "Failed to fetch captures.", data: null };
  }
};

/**
 * Gets the number of captures in a review queue.
 * @param userIds - The user IDs to filter by (optional).
 * @param appIds - The app IDs to filter by (optional).
 * @param stage - REVIEWING (default), REVIEWED or SENT_BACK (admin only).
 * @returns ActionPayload<number>
 */
export const getReviewCapturesCount = async ({
  userIds,
  appIds,
  stage,
}: Omit<GetReviewingCapturesParams, "limit" | "page">): Promise<
  ActionPayload<number>
> => {
  const filterError = validateFilters(userIds, appIds);
  if (filterError) {
    return { ok: false, message: filterError, data: null };
  }
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
  const queue = allowedStage(session, stage);
  if (!queue) {
    return { ok: false, message: "Invalid review stage.", data: null };
  }

  try {
    const count = await prisma.capture.count({
      where: {
        ...(await stageWhere(queue)),
        ...filterWhere(userIds, appIds),
      },
    });
    return { ok: true, message: "Review captures count found.", data: count };
  } catch (err) {
    console.error("Failed to count review queue:", err);
    return { ok: false, message: "Failed to count captures.", data: null };
  }
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
export const getFilterOptionsForTasks = async (
  stage?: TaskStage,
): Promise<
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
  const queue = allowedStage(session, stage);
  if (!queue) {
    return { ok: false, message: "Invalid review stage.", data: null };
  }
  // Options cover the queue being viewed.
  const where = await stageWhere(queue);

  // get unique user IDs from reviewing captures
  let userIds = await prisma.capture.findMany({
    where,
    select: { userId: true },
    distinct: ["userId"],
  });

  if (!userIds) {
    userIds = [];
  }

  // get unique app IDs from reviewing captures
  let appIds = await prisma.capture.findMany({
    where,
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
