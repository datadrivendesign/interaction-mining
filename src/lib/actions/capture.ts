"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { CaptureStatus, Prisma, ScreenGesture } from "@prisma/client";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  deleteFromS3,
  generateSignedCloudFrontURL,
  listFromS3,
} from "../aws/s3/server-internal";
import { ActionPayload } from "./types";
import { requireAuth } from "../auth/auth";
import {
  OWNER_EDITABLE_STATUSES,
  getCaptureForAccess,
  updateCaptureRecord,
} from "./capture-internal";
import { isAdmin } from "@/lib/auth/roles";

export type ListedFiles = {
  fileKey: string;
  fileName: string;
  fileUrl: string;
};

export type CaptureScreenFile = {
  id: string;
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
 * @param otp OTP of the capture to fetch.
 * @param includes Includes parameters to fetch the capture with.
 * @returns ActionPayload of capture.
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
  },
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
 * @param includes Includes parameters to fetch the captures with.
 * @returns ActionPayload of list of captures.
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
  { revalidate: 10, tags: ["capture", "captures-list"] },
);

/**
 * Fetches the number of captures for a user grouped by status.
 * @param userId Id of the user to fetch capture counts for.
 * @returns ActionPayload of list of capture counts grouped by status.
 */
export async function getCaptureCounts({
  userId,
}: {
  userId: string;
}): Promise<ActionPayload<{ status: CaptureStatus; count: number }[]>> {
  // parameter validations
  if (!isValidObjectId(userId)) {
    return { ok: false, message: "Invalid userId provided.", data: null };
  }
  const session = await requireAuth();
  if (!session || !session.user || !session.user.id) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  // get capture counts
  const counts = await prisma.capture.groupBy({
    by: ["status"],
    where: { userId },
    _count: true,
  });
  return {
    ok: true,
    message: "Capture counts found.",
    data: counts.map((count) => ({
      status: count.status as CaptureStatus,
      count: count._count,
    })),
  };
}

interface GetCapturesPaginatedProps {
  userId: string;
  /** One status, or several shown together (In review = REVIEWING + REVIEWED). */
  status: CaptureStatus | CaptureStatus[];
  cursor?: string;
  limit: number;
  includes: Prisma.CaptureInclude;
}

export type CapturesPaginatedOutput = {
  items: Capture[];
  nextCursor: string | undefined;
  hasNextPage: boolean;
};

/**
 * Fetches a list of captures for a user with pagination capability.
 * @param userId Id of the user to fetch captures for.
 * @param status Status of the captures to fetch.
 * @param cursor Cursor to fetch the next set of captures.
 * @param limit Limit of captures to fetch.
 * @param includes Includes parameters to fetch the captures with.
 * @returns ActionPayload of list of captures with pagination capability.
 */
export async function getCapturesPaginated({
  userId,
  status,
  cursor,
  limit,
  includes,
}: GetCapturesPaginatedProps): Promise<ActionPayload<CapturesPaginatedOutput>> {
  // parameter validations
  if (!isValidObjectId(userId)) {
    return { ok: false, message: "Invalid userId provided.", data: null };
  }
  if (cursor && !isValidObjectId(cursor)) {
    return { ok: false, message: "Invalid cursor provided.", data: null };
  }
  if (limit <= 0) {
    return { ok: false, message: "Limit must be greater than 0.", data: null };
  }
  const session = await requireAuth();
  if (!session || !session.user || !session.user.id) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  if (session.user.id !== userId) {
    return { ok: false, message: "User not authorized.", data: null };
  }
  // get captures
  try {
    const { task = false, app = false } = includes || {};
    const query: Prisma.CaptureWhereInput = {
      userId,
      status: Array.isArray(status) ? { in: status } : status,
    };
    const captures = await prisma.capture.findMany({
      where: query,
      include: { app, task },
      orderBy: { id: "desc" },
      take: limit + 1, // Take one extra to check if there's more
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    // set output data
    const hasNextPage = captures.length > limit;
    const items = hasNextPage ? captures.slice(0, limit) : captures;
    const nextCursor = hasNextPage ? items[items.length - 1].id : undefined;
    return {
      ok: true,
      message: "Captures found.",
      data: { items, nextCursor, hasNextPage },
    };
  } catch (err) {
    console.error("Error fetching captures:", err);
    return { ok: false, message: "Failed to fetch captures.", data: null };
  }
}

const captureIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid capture id.");

const feedbackText = z.string().max(20_000).nullable();

/**
 * What the browser may write to a capture. Status is limited to the two
 * owner-driven transitions (Start → PROCESSING, Finish → REVIEWING); the
 * feedback fields exist because the edit page rewrites legacy feedback text
 * into the current wording. REVIEWED / APPROVED / `traceId` are only written
 * through `updateCaptureRecord` by role-checked code.
 */
const updateCaptureInputSchema = z
  .object({
    status: z
      .enum([CaptureStatus.PROCESSING, CaptureStatus.REVIEWING])
      .optional(),
    annotateFeedback: feedbackText.optional(),
    redactFeedback: feedbackText.optional(),
    summarizeFeedback: feedbackText.optional(),
  })
  .strict();

export type UpdateCaptureInput = z.infer<typeof updateCaptureInputSchema>;

/**
 * Updates a capture on behalf of its owner (or an ADMIN).
 *
 * Previously this accepted any `Prisma.CaptureUpdateInput` from any signed-in
 * user, so a worker could set any capture to APPROVED from devtools. Now the id
 * and fields are validated, the caller must own the capture, and an owner may
 * only change status while the capture is still theirs to edit.
 * @param id Id of the capture to update.
 * @param input Fields to update.
 * @returns ActionPayload of updated capture.
 */
export async function updateCapture(
  id: string,
  input: UpdateCaptureInput,
): Promise<ActionPayload<Prisma.CaptureGetPayload<{}>>> {
  const session = await requireAuth();

  if (!session || !session.user || !session.user.id) {
    return { ok: false, message: "User not authenticated.", data: null };
  }

  const parsedId = captureIdSchema.safeParse(id);
  const parsed = updateCaptureInputSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) {
    return { ok: false, message: "Invalid capture update.", data: null };
  }

  try {
    const capture = await getCaptureForAccess(parsedId.data, session);
    if (!capture) {
      return { ok: false, message: "Capture not found.", data: null };
    }

    const admin = isAdmin(session);
    if (
      parsed.data.status !== undefined &&
      !admin &&
      !OWNER_EDITABLE_STATUSES.includes(capture.status)
    ) {
      return {
        ok: false,
        message: "This capture is in review and cannot be changed right now.",
        data: null,
      };
    }

    const updated = await updateCaptureRecord(parsedId.data, parsed.data);
    return { ok: true, message: "Capture updated.", data: updated };
  } catch (err) {
    console.error("Error updating capture:", err);
    return { ok: false, message: "Failed to update capture.", data: null };
  }
}

/**
 * Checks that `fileKey` names an object inside this capture's upload prefix.
 * Browser callers pass keys they were handed by a listing; this stops a
 * crafted key from reaching S3 under another capture's prefix.
 */
function isKeyInCapture(captureId: string, fileKey: string): boolean {
  return (
    fileKey.startsWith(`uploads/${captureId}/`) &&
    !fileKey.includes("..") &&
    fileKey.length <= 1024
  );
}

/**
 * Fetches a list of uploaded files (with signed URLs) for a capture the
 * caller may see.
 * @param captureId The ID of the capture to fetch uploaded files for.
 * @returns ActionPayload of list of uploaded files.
 */
export async function getCaptureFiles(
  captureId: string,
): Promise<ActionPayload<ListedFiles[]>> {
  const parsedId = captureIdSchema.safeParse(captureId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid capture id.", data: null };
  }
  try {
    const session = await requireAuth();
    const capture = await getCaptureForAccess(parsedId.data, session);
    if (!capture) {
      return { ok: false, message: "Capture not found.", data: null };
    }
    const files = await listFromS3(`uploads/${parsedId.data}`);
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
 * Lists a capture's saved drafts (`uploads/<id>/drafts/`), unsigned. Use
 * `getSignedCaptureFileUrl` to read one.
 */
export async function getCaptureDraftFiles(
  captureId: string,
): Promise<ActionPayload<ListedFiles[]>> {
  const parsedId = captureIdSchema.safeParse(captureId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid capture id.", data: null };
  }
  try {
    const session = await requireAuth();
    const capture = await getCaptureForAccess(parsedId.data, session);
    if (!capture) {
      return { ok: false, message: "Capture not found.", data: null };
    }
    const files = await listFromS3(`uploads/${parsedId.data}/drafts`, false);
    if (!files.ok) {
      return { ok: false, message: "Failed to fetch draft files.", data: null };
    }
    return files;
  } catch (err) {
    console.error("Error fetching draft files:", err);
    return { ok: false, message: "Failed to fetch draft files.", data: null };
  }
}

/**
 * Signs a read URL for one object under a capture the caller may see. The key
 * must sit inside `uploads/<captureId>/`; the capture id, not the key, is what
 * authorizes the call.
 */
export async function getSignedCaptureFileUrl(
  captureId: string,
  fileKey: string,
): Promise<ActionPayload<{ signedUrl: string }>> {
  const parsedId = captureIdSchema.safeParse(captureId);
  if (
    !parsedId.success ||
    typeof fileKey !== "string" ||
    !isKeyInCapture(parsedId.data, fileKey)
  ) {
    return { ok: false, message: "Invalid file request.", data: null };
  }
  try {
    const session = await requireAuth();
    const capture = await getCaptureForAccess(parsedId.data, session);
    if (!capture) {
      return { ok: false, message: "Capture not found.", data: null };
    }
    return await generateSignedCloudFrontURL(fileKey);
  } catch (err) {
    console.error("Error signing capture file URL:", err);
    return { ok: false, message: "Failed to generate signed URL", data: null };
  }
}

/**
 * Deletes one uploaded object under a capture. Owners may delete only while
 * the capture is still theirs to edit (CREATED / PROCESSING); ADMIN always.
 */
export async function deleteCaptureFile(
  captureId: string,
  fileKey: string,
): Promise<ActionPayload<null>> {
  const parsedId = captureIdSchema.safeParse(captureId);
  if (
    !parsedId.success ||
    typeof fileKey !== "string" ||
    !isKeyInCapture(parsedId.data, fileKey)
  ) {
    return { ok: false, message: "Invalid file request.", data: null };
  }
  try {
    const session = await requireAuth();
    const capture = await getCaptureForAccess(parsedId.data, session);
    if (!capture) {
      return { ok: false, message: "Capture not found.", data: null };
    }
    if (
      !isAdmin(session) &&
      !OWNER_EDITABLE_STATUSES.includes(capture.status)
    ) {
      return {
        ok: false,
        message: "This capture is in review and its files cannot be deleted.",
        data: null,
      };
    }
    return await deleteFromS3(fileKey);
  } catch (err) {
    console.error("Error deleting capture file:", err);
    return { ok: false, message: "Failed to delete file.", data: null };
  }
}

/**
 * Creates a new capture task in the database.
 * @param data Data to create the capture task with.
 * @returns ActionPayload of created capture.
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

const ObjectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i);

const CreateCaptureTaskInputSchema = z.object({
  appId: z.string().min(1),
  os: z.string().min(1),
  description: z.string().trim().min(1).max(200),
  candidateOrigin: z
    .object({
      candidateTaskAppId: ObjectIdSchema,
      taskIndex: z.number().int().nonnegative(),
    })
    .optional(),
});

/**
 * Creates a new capture task in the database.
 * @param appId Id of the app to create the capture task for.
 * @param os OS of the capture task.
 * @param description Description of the capture task.
 * @returns ActionPayload of created capture and task.
 */
export async function createCaptureTask({
  appId,
  os,
  description,
  candidateOrigin,
}: {
  appId: string;
  os: string;
  description: string;
  candidateOrigin?: {
    candidateTaskAppId: string;
    taskIndex: number;
  };
}) {
  const parsedInput = CreateCaptureTaskInputSchema.safeParse({
    appId,
    os,
    description,
    candidateOrigin,
  });
  if (!parsedInput.success) {
    return {
      ok: false,
      message: "Invalid capture task input.",
      data: null,
    };
  }

  const input = parsedInput.data;

  try {
    const session = await requireAuth();

    if (!session || !session.user || !session.user.id) {
      return { ok: false, message: "User not authenticated.", data: null };
    }

    const app = await prisma.app.findFirst({
      where: { packageName: input.appId, os: input.os },
    });

    if (!app) {
      return {
        ok: false,
        message: "Selected app not found.",
        data: null,
      };
    }

    let candidateTaskApp: Prisma.CandidateTaskAppGetPayload<{
      include: { app: true };
    }> | null = null;
    if (input.candidateOrigin) {
      candidateTaskApp = await prisma.candidateTaskApp.findUnique({
        where: { id: input.candidateOrigin.candidateTaskAppId },
        include: { app: true },
      });

      if (!candidateTaskApp) {
        return {
          ok: false,
          message: "Candidate task app not found.",
          data: null,
        };
      }

      if (
        candidateTaskApp.app.packageName !== input.appId ||
        candidateTaskApp.app.os !== input.os ||
        candidateTaskApp.appId !== app.id
      ) {
        return {
          ok: false,
          message: "Candidate task no longer matches the selected app.",
          data: null,
        };
      }

      const candidateTask =
        candidateTaskApp.tasks[input.candidateOrigin.taskIndex];
      if (!candidateTask) {
        return {
          ok: false,
          message: "Candidate task index is out of range.",
          data: null,
        };
      }

      if (candidateTask.status === "hidden") {
        return {
          ok: false,
          message: "This candidate task is hidden and cannot be started.",
          data: null,
        };
      }
    }

    const task = await prisma.task.create({
      data: {
        appId: input.appId,
        os: input.os,
        description: input.description,
      },
    });

    const capture = await prisma.capture.create({
      data: {
        app: {
          connect: { id: app.id },
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

    // Direct write rather than the `updateUser` action, which is ADMIN-only.
    await prisma.user.update({
      where: { id: session.user.id },
      data: { captures: { connect: { id: capture.id } } },
    });

    if (input.candidateOrigin && candidateTaskApp) {
      await prisma.$runCommandRaw({
        update: "candidate_task_apps",
        updates: [
          {
            q: { _id: { $oid: input.candidateOrigin.candidateTaskAppId } },
            u: {
              $set: {
                isTaken: true,
                [`tasks.${input.candidateOrigin.taskIndex}.status`]: "started",
              },
            },
            multi: false,
          },
        ],
      });
    }

    return {
      ok: true,
      message: "Capture and task created.",
      data: { captureId: capture.id, taskId: task.id },
    };
  } catch (error) {
    console.error("Error creating capture/task:", error);
    return {
      ok: false,
      message: "Failed to create capture and task.",
      data: null,
    };
  }
}

/**
 * Deletes a capture and task from the database.
 * @param captureId Id of the capture to delete.
 * @returns ActionPayload of deleted capture and task.
 */
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
