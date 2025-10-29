"use server";

import { ActionPayload } from "@/lib/actions/types";
import { prisma } from "@/lib/prisma";
import { CaptureStatus, Role } from "@prisma/client";
import { CaptureAdminView } from "./types";
import { isValidObjectId } from "mongoose";
import { requireAuth } from "@/lib/auth";

interface GetUserCapturesParams {
  limit: number;
  page: number;
  userId: string;
  appIds?: string[];
  status?: CaptureStatus;
}

interface GetAdminAppParams {
  id: string;
  packageName: string;
  metadata: {
    name: string;
  };
}

/**
 * Gets the captures for a user with pagination capability.
 * @param limit - The number of captures to return per page.
 * @param page - The page number to return. Must be greater than 0.
 * @param userId - The user ID to filter by.
 * @param appIds - The app IDs to filter by (optional).
 * @param status - The status to filter by (optional).
 * @returns ActionPayload<CaptureAdminView[]>
 */
export const getUserCaptures = async ({
  limit,
  page,
  userId,
  appIds,
  status,
}: GetUserCapturesParams): Promise<ActionPayload<CaptureAdminView[]>> => {
  if (page <= 0) {
    return {
      ok: false,
      message: "Page number must be greater than 0.",
      data: null,
    };
  }
  // parameter validations
  if (limit <= 0) {
    return { ok: false, message: "Limit must be greater than 0.", data: null };
  }

  if (appIds && appIds.some((id) => !isValidObjectId(id))) {
    return { ok: false, message: "Invalid app IDs provided.", data: null };
  }

  if (!isValidObjectId(userId)) {
    return { ok: false, message: "Invalid user ID provided.", data: null };
  }
  // check if user is authenticated and admin
  const session = await requireAuth();

  if (!session) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Unauthorized: Only admins can view user captures.",
      data: null,
    };
  }

  // get user captures
  const captures = await prisma.capture.findMany({
    where: {
      ...(appIds && appIds.length > 0 ? { appId: { in: appIds } } : {}),
      ...(status ? { status: status } : {}),
      userId: userId,
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
    take: limit,
    skip: (page - 1) * limit,
  });

  if (!captures) {
    return { ok: false, message: "No captures found.", data: null };
  }

  return { ok: true, message: "Captures found.", data: captures };
};

/**
 * Gets the number of captures for a user based on filters
 * @param userId - The user ID to filter by.
 * @param appIds - The app IDs to filter by (optional).
 * @param status - The status to filter by (optional).
 * @returns ActionPayload<number>
 */
export const getUserCapturesCount = async ({
  userId,
  appIds,
  status,
}: Omit<GetUserCapturesParams, "limit" | "page">): Promise<
  ActionPayload<number>
> => {
  // parameter validations
  if (appIds && appIds.some((id) => !isValidObjectId(id))) {
    return { ok: false, message: "Invalid app IDs provided.", data: null };
  }

  if (!isValidObjectId(userId)) {
    return { ok: false, message: "Invalid user ID provided.", data: null };
  }
  // check if user is authenticated and admin
  const session = await requireAuth();
  if (!session) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Unauthorized: Only admins can view user captures count.",
      data: null,
    };
  }
  // get user captures count
  const count = await prisma.capture.count({
    where: {
      ...(appIds && appIds.length > 0 ? { appId: { in: appIds } } : {}),
      ...(status ? { status: status } : {}),
      userId: userId,
    },
  });

  return { ok: true, message: "User captures count found.", data: count };
};

/**
 * Gets the number of apps for a user based on filters
 * @param userId - The user ID to filter by.
 * @param appIds - The app IDs to filter by (optional).
 * @param status - The status to filter by (optional).
 * @returns ActionPayload<number>
 */
export const getUserAppsCount = async ({
  userId,
  appIds,
  status,
}: Omit<GetUserCapturesParams, "limit" | "page">): Promise<
  ActionPayload<number>
> => {
  // parameter validations
  if (appIds && appIds.some((id) => !isValidObjectId(id))) {
    return { ok: false, message: "Invalid app IDs provided.", data: null };
  }

  if (!isValidObjectId(userId)) {
    return { ok: false, message: "Invalid user ID provided.", data: null };
  }
  // check if user is authenticated and admin
  const session = await requireAuth();
  if (!session) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Unauthorized: Only admins can view user apps count.",
      data: null,
    };
  }
  // Get unique app IDs from captures first (much faster)
  const captures = await prisma.capture.findMany({
    where: {
      userId: userId,
      ...(appIds && appIds.length > 0 ? { appId: { in: appIds } } : {}),
      ...(status ? { status: status } : {}),
    },
    select: { appId: true },
    distinct: ["appId"],
  });
  // return payloads
  if (!captures) {
    return { ok: false, message: "No captures found.", data: null };
  }

  const count = captures.length;
  return { ok: true, message: "User apps count found.", data: count };
};

/**
 * Gets the filter dropdown options for user captures (apps only).
 * @param userId - The user ID to filter by.
 * @param status - The status to filter by (optional).
 * @returns ActionPayload<GetAdminAppParams[]>
 */
export const getFilterOptionsForUserCaptures = async ({
  userId,
  status,
}: Omit<GetUserCapturesParams, "limit" | "page" | "appIds">): Promise<
  ActionPayload<GetAdminAppParams[]>
> => {
  // parameter validations
  if (!isValidObjectId(userId)) {
    return { ok: false, message: "Invalid user ID provided.", data: null };
  }

  if (status && !Object.values(CaptureStatus).includes(status)) {
    return {
      ok: false,
      message: `Invalid status provided: ${status}`,
      data: null,
    };
  }
  // check if user is authenticated and admin
  const session = await requireAuth();
  if (!session) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Unauthorized: Only admins can view filter options.",
      data: null,
    };
  }

  // get unique app IDs from reviewing captures
  let appIds = await prisma.capture.findMany({
    where: { userId: userId, ...(status ? { status: status } : {}) },
    select: { appId: true },
    distinct: ["appId"],
  });

  if (!appIds) {
    console.error("No app IDs found for user:", userId);
    return { ok: false, message: "No app IDs found for user.", data: null };
  }

  // fetch full user and app data
  const apps = await prisma.app.findMany({
    where: { id: { in: appIds.map((a) => a.appId) } },
    select: {
      id: true,
      metadata: { select: { name: true } },
      packageName: true,
    },
  });

  return {
    ok: true,
    message: "Filter options found.",
    data: apps,
  };
};
