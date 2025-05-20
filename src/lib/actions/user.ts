"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ActionPayload } from "./types";

export type User = Prisma.UserGetPayload<{
  include: {
    captures: true;
    traces: true;
  };
}>;

export async function getUser(
  userId: string,
  { includes }: { includes?: Prisma.UserInclude } = {}
): Promise<ActionPayload<User>> {
  const { captures = false, traces = false } = includes || {};
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        captures,
        traces,
      },
    });

    if (!user) {
      return {
        ok: false,
        message: "User not found",
        data: null,
      };
    }

    return {
      ok: true,
      message: "User found",
      data: user,
    };
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return {
      ok: false,
      message: "Failed to fetch user details",
      data: null,
    };
  }
}

export async function updateUser(userId: string, data: Prisma.UserUpdateInput) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return user;
  } catch (error) {
    console.error("Failed to update user details:", error);
    return null;
  }
}
