"use server";
import { Prisma, Trace as TracePrimitive } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidObjectId } from "mongoose";
import { ActionPayload } from "./types";
import { requireAuth } from "../auth";

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
  limit?: number;
  page?: number;
  includes?: Prisma.TraceInclude;
}

export async function getTraces({
  id,
  userId,
  appId,
  taskId,
  limit = 10,
  page = 1,
  includes = {},
}: GetTracesParams): Promise<ActionPayload<Trace[]>> {
  let traces = [];

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

  const query: Prisma.TraceWhereInput = {
    ...(id ? { id } : {}),
    ...(userId ? { userId } : {}),
    ...(appId ? { appId } : {}),
    ...(taskId ? { taskId } : {}),
  };

  try {
    traces = await prisma.trace.findMany({
      where: query,
      take: limit,
      skip: (page - 1) * limit,
      include: includes,
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

export async function getTrace(
  id: string,
  { includes }: { includes?: Prisma.TraceInclude } = {}
): Promise<ActionPayload<Trace>> {
  const { app = false, screens = false, task = false } = includes || {};

  if (!id || !isValidObjectId(id)) {
    return {
      ok: false,
      message: "Invalid trace ID.",
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

export async function createTrace(
  data: Prisma.TraceCreateWithoutUserInput,
  { includes }: { includes?: Prisma.TraceInclude } = {}
): Promise<ActionPayload<Trace>> {
  let trace = {} as Trace;

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

export async function updateTrace(
  id: string,
  data: Prisma.TraceUpdateInput
): Promise<ActionPayload<TracePrimitive>> {
  let trace = {} as TracePrimitive;

  const query: Prisma.TraceWhereUniqueInput = {
    id,
  };

  try {
    trace = await prisma.trace.update({
      where: query,
      data,
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
