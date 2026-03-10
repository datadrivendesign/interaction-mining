"use server";

import { requireAuth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ActionPayload } from "./types";

export type User = Prisma.UserGetPayload<{}>;

export async function getUser(
  userId: string,
  { includes }: { includes?: Prisma.UserInclude } = {},
  { select }: { select?: Prisma.UserSelect } = {},
): Promise<ActionPayload<User>> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      ...(includes ? { include: includes } : {}),
      ...(select ? { select: select } : {}),
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

const nonEmptyVersionString = z
  .string()
  .trim()
  .min(1)
  .max(100);

const UpdatePreferredDeviceVersionsInputSchema = z.object({
  preferredIOSVersion: z.union([nonEmptyVersionString, z.null()]),
  preferredIPhoneVersion: z.union([nonEmptyVersionString, z.null()]),
});

type PreferredDeviceVersions = {
  preferredIOSVersion: string | null;
  preferredIPhoneVersion: string | null;
};

export async function getMyPreferredDeviceVersions(): Promise<
  ActionPayload<PreferredDeviceVersions>
> {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return {
        ok: false,
        message: "User not authenticated.",
        data: null,
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        preferredIOSVersion: true,
        preferredIPhoneVersion: true,
      },
    });

    if (!user) {
      return {
        ok: false,
        message: "User not found.",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Device preferences loaded.",
      data: {
        preferredIOSVersion: user.preferredIOSVersion ?? null,
        preferredIPhoneVersion: user.preferredIPhoneVersion ?? null,
      },
    };
  } catch (error) {
    console.error("Failed to fetch preferred device versions:", error);
    return {
      ok: false,
      message: "Failed to fetch device preferences.",
      data: null,
    };
  }
}

export async function updateMyPreferredDeviceVersions(
  input: unknown,
): Promise<ActionPayload<PreferredDeviceVersions>> {
  try {
    const session = await requireAuth();
    if (!session?.user?.id) {
      return {
        ok: false,
        message: "User not authenticated.",
        data: null,
      };
    }

    const parsed = UpdatePreferredDeviceVersionsInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Invalid device preference input.",
        data: null,
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferredIOSVersion: parsed.data.preferredIOSVersion,
        preferredIPhoneVersion: parsed.data.preferredIPhoneVersion,
      },
      select: {
        preferredIOSVersion: true,
        preferredIPhoneVersion: true,
      },
    });

    return {
      ok: true,
      message: "Device preferences saved.",
      data: {
        preferredIOSVersion: updatedUser.preferredIOSVersion ?? null,
        preferredIPhoneVersion: updatedUser.preferredIPhoneVersion ?? null,
      },
    };
  } catch (error) {
    console.error("Failed to update preferred device versions:", error);
    return {
      ok: false,
      message: "Failed to save device preferences.",
      data: null,
    };
  }
}
