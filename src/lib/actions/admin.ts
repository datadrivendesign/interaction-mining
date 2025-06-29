"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function updateUserRole(userId: string, newRole: Role) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    console.log(`User role updated: ${userId} to ${newRole}`);
  } catch (error) {
    console.error("Failed to update user role:", error);
  }
}
