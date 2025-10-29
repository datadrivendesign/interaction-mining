"use server";

import { ActionPayload } from "@/lib/actions/types";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { ManageableUser } from "./types";
import { isValidObjectId } from "mongoose";
import { requireAuth } from "@/lib/auth";

interface GetUsersForAdminParams {
  limit: number;
  page: number;
  userIds?: string[];
  role?: Role;
}

interface GetAdminUserParams {
  id: string;
  name: string | null;
  email: string | null;
}

/**
 * Gets the users for the admin panel with pagination capability.
 * @param limit - The number of users to return per page.
 * @param page - The page number to return. Must be greater than 0.
 * @param userIds - The user IDs to filter by (optional).
 * @param role - The role to filter by (optional).
 * @returns ActionPayload<ManageableUser[]>
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
 * Gets the filter dropdown options for the admin panel (users). Should grab all users.
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
