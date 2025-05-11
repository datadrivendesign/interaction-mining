"use server";
import { Prisma, Trace } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidObjectId } from "mongoose";
import { ActionPayload } from "./types";
interface GetTracesParams {
  id?: string;
  appId?: string;
  taskId?: string;
  limit?: number;
  page?: number;
  includes?: Prisma.TraceInclude;
}

export async function getTraces({
  id,
  appId,
  taskId,
  limit = 10,
  page = 1,
  includes = {
    app: false,
    screens: false,
  },
}: GetTracesParams) {
  let traces = [];

  if (id && !isValidObjectId(id)) {
    return { ok: false, message: "Invalid traceId provided.", data: null };
  }

  if (appId && !isValidObjectId(appId)) {
    return { ok: false, message: "Invalid appId provided.", data: null };
  }

  if (taskId && !isValidObjectId(taskId)) {
    return { ok: false, message: "Invalid taskId provided.", data: null };
  }

  const query: Prisma.TraceWhereInput = {
    ...(id ? { id } : {}),
    ...(appId ? { appId } : {}),
    ...(taskId ? { taskId } : {}),
  };

  try {
    traces = await prisma.trace.findMany({
      where: query,
      take: limit,
      skip: (page - 1) * limit,
      include: {
        // app: includes.app,
        screens: includes.screens,
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

type TraceWithIncludes = Prisma.TraceGetPayload<{
  include: {
    app: boolean;
    screens: boolean;
    task: boolean;
  };
}>;

interface GetTraceParams {
  includes?: Prisma.TraceInclude;
}

// export type Trace<
//   Includes extends Prisma.TraceInclude | undefined = undefined,
// > = Prisma.TraceGetPayload<{
//   include: Includes;
// }>;

export async function getTrace(
  id: string,
  { includes }: GetTraceParams = {}
): Promise<ActionPayload<TraceWithIncludes>> {
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

interface CreateTraceIncludesParams {
  includes?: Prisma.TraceInclude;
}

export async function createTrace(
  data: Prisma.TraceCreateInput,
  { includes }: CreateTraceIncludesParams = {}
): Promise<ActionPayload<Trace>> {
  const { screens = false, task = false } = includes || {};
  let trace: Trace | null = {} as Trace;
  try {
    trace = await prisma.trace.create({ data, include: { screens, task } });

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
): Promise<ActionPayload<Trace>> {
  let trace: Trace | null = {} as Trace;

  const query: Prisma.TraceWhereUniqueInput = {
    id,
  };

  try {
    trace = await prisma.trace.update({
      where: query,
      data,
    });

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
