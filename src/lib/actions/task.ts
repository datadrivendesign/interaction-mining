"use server";
import { Prisma, Task } from "@prisma/client";
import { isObjectIdOrHexString } from "mongoose";

import { prisma } from "@/lib/prisma";

// export type TaskWithAppTraces = Prisma.TaskGetPayload<{
//   include: { app: true; traces: true };
// }>;



export async function getTask(id: string): Promise<Task | null> {
  let task: Task | null = null;

  console.log("ID", id);

  if (!id || !isObjectIdOrHexString(id)) {
    throw new Error("Invalid task ID.");
  }

  try {
    task = (await prisma.task.findUnique({
      where: {
        id,
      },
      include: {
        // app: true,
        traces: true,
      },
    })) as Task;
  } catch (err: any) {
    console.error(err);
    throw new Error("Failed to fetch task.");
  }

  if (!task) {
    throw new Error("Task not found.");
  }

  return task;
}
