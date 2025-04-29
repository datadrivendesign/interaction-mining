"use server";

import { prisma } from "@/lib/prisma";

export async function getUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        traces: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return null;
  }
}
