"use server";

import { Capture, CaptureStatus, Role } from "@prisma/client";
import { updateCapture } from "@/lib/actions";
import { ActionPayload } from "@/lib/actions/types";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidObjectId } from "mongoose";
import { REVIEWING_CAPTURE_ORDER_BY } from "@/app/(signed-in)/admin/util";

export async function validateApprovePermissions(): Promise<
  ActionPayload<null>
> {
  // server side auth check
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Unauthorized", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Only admins can approve captures",
      data: null,
    };
  }
  return {
    ok: true,
    message: "Auth check passed",
    data: null,
  };
}

export async function denyCapture(
  capture: Capture,
  annotateFeedback: string,
  redactFeedback: string,
  summarizeFeedback: string,
): Promise<ActionPayload<null>> {
  // server side auth check
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Unauthorized", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Only admins can approve captures",
      data: null,
    };
  }
  // handle update logic
  try {
    const updateRes = await updateCapture(capture.id, {
      status: CaptureStatus.PROCESSING,
      annotateFeedback,
      redactFeedback,
      summarizeFeedback,
    });
    if (!updateRes.ok) {
      throw new Error(updateRes.message ?? "Failed to update capture");
    }
    return {
      ok: true,
      message: "Capture denied successfully",
      data: null,
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to update capture to denied status",
      data: null,
    };
  }
}

export async function getNextReviewingCaptureId(
  currentCaptureId: string,
): Promise<ActionPayload<string | null>> {
  if (!isValidObjectId(currentCaptureId)) {
    return {
      ok: false,
      message: "Invalid capture ID.",
      data: null,
    };
  }

  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Unauthorized", data: null };
  }
  if (session.user.role !== Role.ADMIN) {
    return {
      ok: false,
      message: "Only admins can review captures",
      data: null,
    };
  }

  try {
    const nextCapture = await prisma.capture.findFirst({
      where: {
        status: CaptureStatus.REVIEWING,
        id: { lt: currentCaptureId },
      },
      orderBy: REVIEWING_CAPTURE_ORDER_BY,
      select: { id: true },
    });

    return {
      ok: true,
      message: nextCapture
        ? "Next reviewing capture found."
        : "No additional reviewing captures found.",
      data: nextCapture?.id ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "Failed to fetch next reviewing capture",
      data: null,
    };
  }
}
