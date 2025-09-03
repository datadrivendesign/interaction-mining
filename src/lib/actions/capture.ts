"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { CaptureStatus, Prisma, ScreenGesture } from "@prisma/client";
import { isValidObjectId } from "mongoose";
import { prisma } from "@/lib/prisma";
import { listFromS3 } from "../aws";
import { ActionPayload } from "./types";
import { requireAuth } from "../auth/auth";
import { updateUser } from "./user";

export type ListedFiles = {
  fileKey: string;
  fileName: string;
  fileUrl: string;
};

export type CaptureScreenFile = {
  vh: string;
  img: string;
  created: string;
  gesture: ScreenGesture;
};

export type Capture = Prisma.CaptureGetPayload<{
  include: {
    app: boolean;
    task: boolean;
  };
}>;

export type CaptureAdminView = Prisma.CaptureGetPayload<{
  include: {
    app: boolean;
    task: boolean;
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

interface GetCaptureProps {
  id?: string;
  taskId?: string;
  otp?: string;
  includes?: Prisma.CaptureInclude;
}

/**
 * Fetches a capture from the database.
 * @param id Id of the capture to fetch.
 * @param taskId Id of the task to fetch the capture for.
 * @param otp OTP of the capture to fetch.
 * @returns ActionPayload
 */
export const getCapture = unstable_cache(
  async ({
    id,
    otp,
    includes,
  }: GetCaptureProps): Promise<ActionPayload<Capture>> => {
    const { task = false, app = false } = includes || {};

    if (!id && !otp) {
      return { ok: false, message: "No search criteria provided.", data: null };
    }

    if (id && !isValidObjectId(id)) {
      return { ok: false, message: "Invalid captureId provided.", data: null };
    }

    const query: Prisma.CaptureWhereInput = {
      ...(id ? { id } : {}),
      ...(otp ? { otp } : {}),
    };

    try {
      const capture = await prisma.capture.findFirst({
        where: query,
        include: {
          app,
          task,
        },
      });

      if (!capture) {
        return { ok: false, message: "Capture not found.", data: null };
      }

      return { ok: true, message: "Capture found.", data: capture };
    } catch (err) {
      console.error("Error fetching capture:", err);
      return { ok: false, message: "Failed to fetch capture.", data: null };
    }
  },
  ["capture-single"],
  {
    revalidate: 10,
    tags: ["capture", "capture-single"],
  }
);

/**
 * Handle revalidation of capture cache in getCapture.
 */
export async function revalidateCaptureCaches() {
  revalidateTag("capture");
}

interface GetCapturesProps {
  userId?: string;
  appId?: string;
  taskId?: string;
  includes?: Prisma.CaptureInclude;
}

/**
 * Fetches a list of captures from the database.
 * @param userId Id of the user to fetch captures for.
 * @param appId Id of the app to fetch captures for.
 * @param taskId Id of the task to fetch captures for.
 * @returns ActionPayload
 */
export const getCaptures = unstable_cache(
  async ({
    userId,
    appId,
    taskId,
    includes,
  }: GetCapturesProps): Promise<ActionPayload<Capture[]>> => {
    const { task = false, app = false } = includes || {};

    if (!userId && !appId && !taskId) {
      return { ok: false, message: "No search criteria provided.", data: null };
    }

    if (userId && !isValidObjectId(userId)) {
      return { ok: false, message: "Invalid userId provided.", data: null };
    }

    if (appId && !isValidObjectId(appId)) {
      return { ok: false, message: "Invalid appId provided.", data: null };
    }

    if (taskId && !isValidObjectId(taskId)) {
      return { ok: false, message: "Invalid taskId provided.", data: null };
    }

    const query: Prisma.CaptureWhereInput = {
      ...(userId ? { userId } : {}),
      ...(appId ? { appId } : {}),
      ...(taskId ? { taskId } : {}),
    };

    try {
      const captures = await prisma.capture.findMany({
        where: query,
        include: {
          app,
          task,
        },
      });

      if (!captures) {
        return { ok: false, message: "No captures found.", data: null };
      }

      return { ok: true, message: "Captures found.", data: captures };
    } catch (err) {
      console.error("Error fetching captures:", err);
      return { ok: false, message: "Failed to fetch captures.", data: null };
    }
  },
  ["captures-list"],
  { revalidate: 10, tags: ["capture", "captures-list"] }
);

/**
 * Updates a capture in the database.
 * @param id Id of the capture to update.
 * @param data Data to update the capture with.
 * @returns ActionPayload
 */
export async function updateCapture(
  id: string,
  data: Prisma.CaptureUpdateInput
) {
  const session = await requireAuth();

  if (!session || !session.user || !session.user.id) {
    return { ok: false, message: "User not authenticated.", data: null };
  }

  try {
    const capture = await prisma.capture.update({
      where: { id },
      data,
    });

    return { ok: true, message: "Capture updated.", data: capture };
  } catch (err) {
    console.error("Error updating capture:", err);
    return { ok: false, message: "Failed to update capture.", data: null };
  }
}

/**
 * Fetches a list of uploaded files for a given capture ID from S3.
 * @param captureId The ID of the capture to fetch uploaded files for.
 * @returns ActionPayload
 */
export async function getCaptureFiles(
  captureId: string
): Promise<ActionPayload<ListedFiles[]>> {
  try {
    const files = await listFromS3(`uploads/${captureId}`);
    if (!files.ok) {
      return {
        ok: false,
        message: "Failed to fetch uploaded files.",
        data: null,
      };
    }
    return files;
  } catch (err) {
    console.error("Error fetching uploaded files:", err);
    return {
      ok: false,
      message: "Failed to fetch uploaded files.",
      data: null,
    };
  }
}

/**
 * Creates a new capture task in the database.
 * @param data Data to create the capture task with.
 * @returns ActionPayload
 */
export async function createCapture({
  data,
}: {
  data: Prisma.CaptureCreateInput;
}) {
  try {
    const session = await requireAuth();

    if (!session || !session.user) {
      return { ok: false, message: "User not authenticated.", data: null };
    }

    const capture = await prisma.capture.create({
      data,
    });

    return {
      ok: true,
      message: "Capture created.",
      data: capture,
    };
  } catch (error) {
    console.error("Error creating capture/task:", error);
    return {
      ok: false,
      message: "Failed to create capture and task",
      data: null,
    };
  }
}

/**
 * Creates a new capture task in the database.
 * @param data Data to create the capture task with.
 * @returns ActionPayload
 */
export async function createCaptureTask({
  appId,
  os,
  description,
}: {
  appId: string;
  os: string;
  description: string;
}) {
  try {
    const session = await requireAuth();

    if (!session || !session.user || !session.user.id) {
      return { ok: false, message: "User not authenticated.", data: null };
    }

    const app = await prisma.app.findFirst({
      where: { packageName: appId },
    });

    const task = await prisma.task.create({
      data: { appId, os, description },
    });

    const capture = await prisma.capture.create({
      data: {
        app: {
          connect: { id: app?.id },
        },
        task: {
          connect: { id: task.id },
        },
        user: {
          connect: { id: session.user.id },
        },
        otp: "",
        src: "",
        status: CaptureStatus.CREATED,
      } as Prisma.CaptureCreateInput,
    });

    const user = await updateUser(session.user.id, {
      captures: {
        connect: { id: capture.id },
      },
    });

    if (!user) {
      return { ok: false, message: "Failed to update user.", data: null };
    }

    return {
      ok: true,
      message: "Capture and task created.",
      data: { captureId: capture.id, taskId: task.id },
    };
  } catch (error) {
    console.error("Error creating capture/task:", error);
    throw new Error("Failed to create capture and task");
  }
}

export async function deleteCaptureTask(captureId: string) {
  try {
    const session = await requireAuth();
    if (!session || !session.user || !session.user.id) {
      return { ok: false, message: "User not authenticated.", data: null };
    }

    const findCapture = await prisma.capture.findUnique({
      where: { id: captureId },
    });
    // error cases if capture not found or user not authorized
    if (!findCapture) {
      return { ok: false, message: "Capture not found.", data: null };
    }
    if (findCapture.userId !== session.user.id) {
      return { ok: false, message: "User not authorized.", data: null };
    }
    // delete capture and task
    const deleteCapture = await prisma.capture.delete({
      where: { id: captureId },
    });
    await prisma.task.delete({
      where: { id: deleteCapture.taskId },
    });
    // return deleted capture metadata
    return {
      ok: true,
      message: "Capture and task deleted.",
      data: deleteCapture,
    };
  } catch (error) {
    console.error("Error deleting capture/task:", error);
    return {
      ok: false,
      message: "Failed to delete capture and task",
      data: null,
    };
  }
}
