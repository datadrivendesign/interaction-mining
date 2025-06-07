"use server";

import { unstable_cache } from "next/cache";
import { Prisma, ScreenGesture } from "@prisma/client";
import { isValidObjectId } from "mongoose";
import { prisma } from "@/lib/prisma";
import { listFromS3, lambda, copyFromS3 } from "../aws";
import { ActionPayload } from "./types";
import { requireAuth } from "../auth";
import { updateUser } from "./user";
import { InvokeCommand } from "@aws-sdk/client-lambda";

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
  undefined,
  { revalidate: 10 }
);

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

    console.log("Querying captures with:", query);

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
  undefined,
  { revalidate: 10 }
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
    const files = await listFromS3(`processed/${captureId}`);
    return files
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

/**
 * TODO: call this function in Android api route too
 * @param fileKey
 * @returns
 */
export async function processCaptureFiles(fileKey: string) {
  console.log("Transcoding video for file key:", fileKey);
  if (process.env.NEXT_PUBLIC_ENABLE_TRANSCODE !== "true") {
    console.log("Lambda transcoding is disabled via env config.");
    const captureId = fileKey.split("/")[1];
    const destPathIndex = fileKey.indexOf(captureId);
    const destPath = fileKey.substring(destPathIndex);
    const res = await copyFromS3(fileKey, `processed/${destPath}`);
    if (!res.ok) {
      console.error("Failed to copy file to processed folder:", res.message);
      return { ok: false, message: res.message, data: null };
    }
    return { 
      ok: true, 
      message: "Processing successfuly, disabled transcode.", 
      data: null 
  };
  }

  const cmd = new InvokeCommand({
    FunctionName: "odim-transcode-mp4-webm",
    InvocationType: "RequestResponse",
    Payload: Buffer.from(
      JSON.stringify({ bucket: process.env.AWS_UPLOAD_BUCKET!, key: fileKey })
    ),
  });
  const res = await lambda.send(cmd);

  // Parse the Lambda payload into JSON
  const raw = res.Payload ? new TextDecoder().decode(res.Payload) : "";
  let response: { statusCode?: number; body?: string; [key: string]: any } = {};
  try {
    response = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse Lambda payload:", raw, err);
    return { ok: false, message: "Invalid transcoding response", data: null };
  }

  console.log("Parsed transcoding response:", response);

  // Extract HTTP status and body
  const { statusCode, body } = response;
  let result: any = {};
  try {
    result = body ? JSON.parse(body) : {};
  } catch {
    result = { message: body };
  }

  if (statusCode !== 200) {
    console.error(
      "Transcoding Lambda returned error status:",
      statusCode,
      result
    );
    return {
      ok: false,
      message: result.message || "Transcoding failed",
      data: null,
    };
  }

  // Successful transcoding
  return {
    ok: true,
    message: result.message || "Video transcoded successfully",
    data: result,
  };
}
