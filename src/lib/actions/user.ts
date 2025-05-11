"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user;
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return null;
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
