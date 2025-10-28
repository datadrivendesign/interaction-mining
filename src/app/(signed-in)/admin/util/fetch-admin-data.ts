"use server";

import { ActionPayload } from "@/lib/actions/types";
import { prisma } from "@/lib/prisma";
import { App, CaptureStatus, Role } from "@prisma/client";
import { CaptureAdminView, ManageableUser } from "./types";
import { isValidObjectId } from "mongoose";
import { requireAuth } from "@/lib/auth";

interface GetReviewingCapturesParams {
  limit: number;
  page: number;
  userIds?: string[];
  appIds?: string[];
}

interface GetUsersForAdminParams {
  limit: number;
  page: number;
  userIds?: string[];
  role?: Role;
}

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

interface GetAdminUserParams {
  id: string;
  name: string | null;
  email: string | null;
}

/**
 * Gets the captures in review for the admin panel with pagination capability.
 * @param limit - The number of captures to return per page.
 * @param page - The page number to return. Must be greater than 0.
 * @param userIds - The user IDs to filter by (optional).
 * @param appIds - The app IDs to filter by (optional).
 * @param searchTerm - The search term to filter by (optional).
 * @returns ActionPayload<CaptureAdminView[]>
 */
export const getReviewingCaptures = async ({
  limit,
  page,
  userIds,
  appIds,
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
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Unauthorized: Only admins can view reviewing captures.",
      data: null,
    };
  }
  // get reviewing captures
  const captures = await prisma.capture.findMany({
    where: {
      status: CaptureStatus.REVIEWING,
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
    take: limit,
    skip: (page - 1) * limit,
  });
  // return payloads
  if (!captures) {
    return { ok: false, message: "No captures found.", data: null };
  }

  return { ok: true, message: "Captures found.", data: captures };
};

/**
 * Gets the users for the admin panel with pagination capability.
 * @param limit - The number of users to return per page.
 * @param page - The page number to return. Must be greater than 0.
 * @param userIds - The user IDs to filter by (optional).
 * @param role - The role to filter by (optional).
 * @returns ActionPayload<ManageableUser[]>
 *
 * Note: This function does not filter by role.
 */
export const getUsersForAdmin = async ({
  limit,
  page,
  userIds,
  role,
}: GetUsersForAdminParams): Promise<ActionPayload<ManageableUser[]>> => {
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
  // check if user is authenticated and admin
  const session = await requireAuth();

  if (!session) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Unauthorized: Only admins can view users.",
      data: null,
    };
  }
  // get users
  const users = await prisma.user.findMany({
    where: {
      ...(userIds && userIds.length > 0 ? { id: { in: userIds } } : {}),
      ...(role ? { role: role } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    take: limit,
    skip: (page - 1) * limit,
  });
  // return payloads
  if (!users) {
    return { ok: false, message: "No users found.", data: null };
  }

  return { ok: true, message: "Users found.", data: users };
};

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
 * Gets the total number of captures in need of review
 * @param userIds - The user IDs to filter by (optional).
 * @param appIds - The app IDs to filter by (optional).
 * @returns ActionPayload<number>
 */
export const getReviewCapturesCount = async ({
  userIds,
  appIds,
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
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Unauthorized: Only admins can view review captures count.",
      data: null,
    };
  }
  // get review captures count
  const count = await prisma.capture.count({
    where: {
      status: CaptureStatus.REVIEWING,
      ...(userIds && userIds.length > 0 ? { userId: { in: userIds } } : {}),
      ...(appIds && appIds.length > 0 ? { appId: { in: appIds } } : {}),
    },
  });

  return { ok: true, message: "Review captures count found.", data: count };
};

/**
 * Gets the total number of users in the database.
 * @param userIds - The user IDs to filter by (optional).
 * @param role - The role to filter by (optional).
 * @returns ActionPayload<number>
 */
export const getUsersCount = async ({
  userIds,
  role,
}: Omit<GetUsersForAdminParams, "limit" | "page">): Promise<
  ActionPayload<number>
> => {
  // parameter validations
  if (userIds && userIds.some((id) => !isValidObjectId(id))) {
    return { ok: false, message: "Invalid user IDs provided.", data: null };
  }
  // check if user is authenticated and admin
  const session = await requireAuth();
  if (!session) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Unauthorized: Only admins can view users count.",
      data: null,
    };
  }
  // get users count
  const count = await prisma.user.count({
    where: {
      ...(userIds && userIds.length > 0 ? { id: { in: userIds } } : {}),
      ...(role ? { role: role } : {}),
    },
  });

  return { ok: true, message: "Users count found.", data: count };
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
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Unauthorized: Only admins can view filter options.",
      data: null,
    };
  }

  // get unique user IDs from reviewing captures
  let userIds = await prisma.capture.findMany({
    where: { status: CaptureStatus.REVIEWING },
    select: { userId: true },
    distinct: ["userId"],
  });

  if (!userIds) {
    userIds = [];
  }

  // get unique app IDs from reviewing captures
  let appIds = await prisma.capture.findMany({
    where: { status: CaptureStatus.REVIEWING },
    select: { appId: true },
    distinct: ["appId"],
  });

  if (!appIds) {
    appIds = [];
  }

  // fetch full user and app data
  const [users, apps] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds.map((u) => u.userId as string) } },
      select: { id: true, name: true, email: true },
    }),
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

/**
 * Gets the filter dropdown options for the admin panel (users). Should grab all users.
 * @param role - The role to filter by (optional).
 * @returns ActionPayload<GetAdminUserParams[]>
 */
export const getFilterOptionsForUsers = async (): Promise<
  ActionPayload<GetAdminUserParams[]>
> => {
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

  // get user IDs from all users
  let users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });

  return {
    ok: true,
    message: "Filter options found.",
    data: users,
  };
};

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
