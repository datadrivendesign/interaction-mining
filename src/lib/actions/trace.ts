"use server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isObjectIdOrHexString } from "mongoose";

export type TraceWithScreens = Prisma.TraceGetPayload<{
  include: { screens: true };
}>;

interface GetTraceParams {
  limit?: number;
  page?: number;
}

export async function getTraces({ limit = 10, page = 1 }: GetTraceParams = {}) {
  let traces: TraceWithScreens[] = [];

  try {
    traces = (await prisma.trace.findMany({
      take: limit,
      skip: (page - 1) * limit,
      include: {
        screens: true,
      },
    })) as TraceWithScreens[];
  } catch (err: any) {
    console.error(err);
    throw new Error("Failed to fetch traces.");
  }

  return traces;
}

export async function getTrace(
  id: string
): Promise<TraceWithScreens | null> {
  let trace: TraceWithScreens | null = null;

  if (!id || !isObjectIdOrHexString(id)) {
    return null;
  }
  try {
    trace = (await prisma.trace.findUnique({
      where: {
        id,
      },
      include: {
        screens: true,
      },
    })) as TraceWithScreens;
  } catch {
    throw new Error("Failed to fetch trace.");
  }

  return trace;
}

export async function getTraceByApp(id: string) {
  let trace: TraceWithScreens[] = [] as TraceWithScreens[];

  if (!id || !isObjectIdOrHexString(id)) {
    let e = new Error("Invalid app id.");
    e.name = "TypeError";
    throw e;
  }
  try {
    trace = await prisma.trace.findMany({
      where: {
        appId: id,
      },
      include: {
        screens: true,
      },
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch trace.");
  }

  return trace;
}

export async function updateTrace(
  id: string,
  updates: Partial<{ name: string; description: string }>
) {
  // Validate the trace ID
  if (!id || !isObjectIdOrHexString(id)) {
    let e = new Error("Invalid trace ID.");
    e.name = "TypeError";
    throw e;
  }

  // Check if there are any updates to apply
  if (!updates || Object.keys(updates).length === 0) {
    let e = new Error("No updates provided.");
    e.name = "ValidationError";
    throw e;
  }

  try {
    // Perform the update on the trace
    const updatedTrace = await prisma.trace.update({
      where: { id },
      data: updates,
    });

    return updatedTrace;
  } catch (error) {
    console.error("Failed to update trace:", error);
    throw new Error("An error occurred while updating the trace.");
  }
}
