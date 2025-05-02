"use server";

import { prisma } from "@/lib/prisma";
import { User, Role } from "@prisma/client";

export async function updateUserRole(userId: string, newRole: Role) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    console.log(`User role updated: ${userId} to ${newRole}`)
  } catch (error) {
    console.error("Failed to update user role:", error);
  }
}

export async function getUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId},
      select: {
        name: true,
        email: true,
        image: true,
        role: true,
        // traces: {
        //   select: {
        //     id: true,
        //     createdAt: true,
        //   },
        // },
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return null;
  }
}

