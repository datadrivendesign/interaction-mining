"use server";

import { Capture, CaptureStatus, Role } from "@prisma/client";
import { updateCapture } from "@/lib/actions";
import { TraceFormData } from "../../edit/components/types";
import { ActionPayload } from "@/lib/actions/types";
import { auth } from "@/lib/auth";

export async function approveCapture(
  traceData: TraceFormData,
  capture: Capture
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
  return {
    ok: true,
    message: "Auth check passed",
    data: null,
  };
}

export async function denyCapture(
  capture: Capture,
  feedback: string
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
      feedback,
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
