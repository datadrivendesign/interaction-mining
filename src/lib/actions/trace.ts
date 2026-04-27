"use server";
import { Prisma, Trace as TracePrimitive } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidObjectId } from "mongoose";
import { ActionPayload } from "./types";
import { requireAuth } from "../auth/auth";

export type Trace = Prisma.TraceGetPayload<{
  include: {
    app: boolean;
    screens: boolean;
    task: boolean;
  };
}>;

interface GetTracesParams {
  id?: string;
  userId?: string;
  appId?: string;
  taskId?: string;
  captureId?: string;
  limit?: number;
  page?: number;
  includes?: Prisma.TraceInclude;
}

/**
 * Fetches a list of traces from the database.
 * @param id Id of the trace to fetch.
 * @param userId Id of the user to fetch traces for.
 * @param appId Id of the app to fetch traces for.
 * @param taskId Id of the task to fetch traces for.
 * @param captureId Id of the capture to fetch traces for.
 * @param limit Limit of traces to fetch.
 * @param page Page number to fetch.
 * @param includes Includes parameters to fetch the traces with.
 * @returns ActionPayload of list of traces.
 */
export async function getTraces({
  id,
  userId,
  appId,
  taskId,
  captureId,
  limit = 10,
  page = 1,
  includes = {},
}: GetTracesParams): Promise<ActionPayload<Trace[]>> {
  const { app = false, screens = false, task = false } = includes;
  let traces = [];
  // parameter validations
  if (id && !isValidObjectId(id)) {
    return { ok: false, message: "Invalid traceId provided.", data: null };
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
  if (captureId && !isValidObjectId(captureId)) {
    return { ok: false, message: "Invalid captureId provided.", data: null };
  }
  // Check if user is authenticated if userId is provided
  if (userId) {
    const session = await requireAuth();
    if (!session) {
      return { ok: false, message: "User not authenticated.", data: null };
    }
    if (session.user.id !== userId) {
      return { ok: false, message: "User not authorized.", data: null };
    }
  }
  // set query and get traces
  const query: Prisma.TraceWhereInput = {
    ...(id ? { id } : {}),
    ...(userId ? { userId } : {}),
    ...(appId ? { appId } : {}),
    ...(taskId ? { taskId } : {}),
    ...(captureId ? { captureId } : {}),
  };

  try {
    traces = await prisma.trace.findMany({
      where: query,
      take: limit,
      skip: (page - 1) * limit,
      include: {
        app,
        screens,
        task,
      },
    });

    if (!traces) {
      return {
        ok: false,
        message: "No traces found.",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Traces found.",
      data: traces,
    };
  } catch (err: any) {
    console.error(err);
    return {
      ok: false,
      message: "Failed to fetch traces.",
      data: null,
    };
  }
}

interface GetTracesPaginatedProps {
  userId: string;
  cursor?: string;
  limit: number;
  includes: Prisma.TraceInclude;
}
/**
 * Fetches a list of traces from the database with pagination capability.
 * @param userId Id of the user to fetch trace for.
 * @param cursor Cursor to fetch the next set of traces.
 * @param limit Limit of traces to fetch.
 * @param includes Includes parameters to fetch the traces with.
 * @returns ActionPayload of list of traces with pagination capability.
 */
export async function getTracesPaginated({
  userId,
  cursor,
  limit,
  includes,
}: GetTracesPaginatedProps): Promise<
  ActionPayload<{
    items: Trace[];
    nextCursor: string | undefined;
    hasNextPage: boolean;
  }>
> {
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
  // Check if user is authenticated if userId is provided
  if (userId) {
    const session = await requireAuth();
    if (!session) {
      return { ok: false, message: "User not authenticated.", data: null };
    }
    if (session.user.id !== userId) {
      return { ok: false, message: "User not authorized.", data: null };
    }
  }
  // get traces
  try {
    const { app = false, screens = false, task = false } = includes || {};
    const query: Prisma.TraceWhereInput = { ...(userId ? { userId } : {}) };
    const traces = await prisma.trace.findMany({
      where: query,
      include: { app, screens, task },
      orderBy: { created: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    // set output data
    const hasNextPage = traces.length > limit;
    const items = hasNextPage ? traces.slice(0, limit) : traces;
    const nextCursor = hasNextPage ? items[items.length - 1].id : undefined;
    return {
      ok: true,
      message: "Traces found.",
      data: { items, nextCursor, hasNextPage },
    };
  } catch (err) {
    console.error("Error fetching traces:", err);
    return { ok: false, message: "Failed to fetch traces.", data: null };
  }
}

/**
 * Fetches a trace from the database.
 * @param id Id of the trace to fetch.
 * @param includes Includes parameters to fetch the trace with.
 * @returns ActionPayload of trace.
 */
export async function getTrace(
  id: string,
  { includes }: { includes?: Prisma.TraceInclude } = {},
): Promise<ActionPayload<Trace>> {
  const { app = false, screens = false, task = false } = includes || {};

  if (!id || !isValidObjectId(id)) {
    return {
      ok: false,
      message: "Invalid traceId.",
      data: null,
    };
  }

  const query: Prisma.TraceWhereUniqueInput = {
    id,
  };

  try {
    const trace = await prisma.trace.findUnique({
      where: query,
      include: {
        app,
        screens,
        task,
      },
    });

    if (!trace) {
      return {
        ok: false,
        message: "Trace not found.",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Trace found.",
      data: trace,
    };
  } catch (err: any) {
    console.error(err);
    return {
      ok: false,
      message: "Failed to fetch trace.",
      data: null,
    };
  }
}

/**
 * Creates a new trace in the database.
 * @param data Data to create the trace with.
 * @param includes Includes parameters to fetch the trace with.
 * @returns ActionPayload of created trace.
 */
export async function createTrace(
  data: Prisma.TraceCreateWithoutUserInput,
  { includes }: { includes?: Prisma.TraceInclude } = {},
): Promise<ActionPayload<TracePrimitive>> {
  let trace = {} as TracePrimitive;

  let session = await requireAuth();

  if (!session) {
    return {
      ok: false,
      message: "User not authenticated.",
      data: null,
    };
  }

  try {
    trace = await prisma.trace.create({
      data: {
        ...data,
        user: { connect: { id: session.user.id } },
      },
      include: {
        app: includes?.app || false,
        screens: includes?.screens || false,
        task: includes?.task || false,
      },
    });

    if (!trace) {
      return {
        ok: false,
        message: "Failed to create trace.",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Trace created.",
      data: trace,
    };
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      message: "Failed to create trace.",
      data: null,
    };
  }
}

/**
 * Updates a trace in the database.
 * @param id Id of the trace to update.
 * @param data Data to update the trace with.
 * @param includes Includes parameters to fetch the trace with.
 * @returns ActionPayload of updated trace.
 */
export async function updateTrace(
  id: string,
  data: Prisma.TraceUpdateInput,
  { includes }: { includes?: Prisma.TraceInclude } = {},
): Promise<ActionPayload<TracePrimitive>> {
  let trace = {} as TracePrimitive;
  // parameter validations
  if (!id || !isValidObjectId(id)) {
    return { ok: false, message: "Invalid traceId provided.", data: null };
  }
  // set query and update trace
  const query: Prisma.TraceWhereUniqueInput = {
    id,
  };

  try {
    trace = await prisma.trace.update({
      where: query,
      data,
      include: {
        app: includes?.app || false,
        screens: includes?.screens || false,
        task: includes?.task || false,
      },
    });

    if (!trace) {
      return {
        ok: false,
        message: "Failed to update trace.",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Trace updated.",
      data: trace,
    };
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      message: "Failed to update trace.",
      data: null,
    };
  }
}
