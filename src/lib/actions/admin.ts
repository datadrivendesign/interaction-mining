"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { auth } from "../auth";
import { ActionPayload } from "./types";

export async function updateUserRole(
  userId: string, 
  newRole: Role
): Promise<ActionPayload<null>> {
  // do security checks to make sure only admin can update role
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      message: "Unauthorized: User not authenticated",
      data: null,
    };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Unauthorized: Only admins can update user roles",
      data: null,
    };
  }
  if (session.user.id === userId && newRole === Role.USER)  {
    return {
      ok: false,
      message: "Cannot demote yourself from admin role",
      data: null,
    };
  }
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    return {
      ok: true,
      message: "User role updated successfully",
      data: null,
    };
  } catch (error) {
    return {
      ok: false,
      message: "Failed to update user role",
      data: null,
    };
  }
}
