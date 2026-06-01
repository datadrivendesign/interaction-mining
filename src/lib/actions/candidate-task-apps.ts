"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ActionPayload } from "./types";
import { z } from "zod";
import { requireAuth } from "../auth/auth";

export type CandidateTaskApp = Prisma.CandidateTaskAppGetPayload<{
  include: {
    app: true;
  };
}>;

const ObjectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i);

const GetCandidateTaskAppsInputSchema = z.object({
  isTaken: z.boolean(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(200).default(100),
  search: z.string().default(""),
  excludeGenres: z.array(z.string()).default([]),
  selectedGenres: z.array(z.string()).default([]),
});

const SetCandidateTaskAppTakenStatusInputSchema = z.object({
  id: ObjectIdSchema,
  isTaken: z.boolean(),
});

const CandidateTaskStatusSchema = z.enum(["open", "started", "hidden"]);

const SetCandidateTaskStatusInputSchema = z.object({
  id: ObjectIdSchema,
  taskIndex: z.number().int().nonnegative(),
  status: CandidateTaskStatusSchema,
});

const GetCandidateTaskCapturePrefillInputSchema = z.object({
  candidateTaskAppId: ObjectIdSchema,
  taskIndex: z.number().int().nonnegative(),
});

export type CandidateTaskCapturePrefill = {
  candidateTaskAppId: string;
  taskIndex: number;
  platform: string;
  app: {
    name: string;
    id: string;
  };
  task: {
    description: string;
    status: string;
  };
};

/**
 * Fetches candidate task apps from the database.
 * @param isTaken Whether the candidate task app is taken.
 * @returns ActionPayload<CandidateTaskApp[]>
 */
export const getCandidateTaskApps = async ({
  isTaken = false,
  page = 1,
  pageSize = 100,
  search = "",
  excludeGenres = [],
  selectedGenres = [],
}: {
  isTaken: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  excludeGenres?: string[];
  selectedGenres?: string[];
}): Promise<
  ActionPayload<{
    candidateTaskApps: CandidateTaskApp[];
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
  }>
> => {
  const parsedInput = GetCandidateTaskAppsInputSchema.safeParse({
    isTaken,
    page,
    pageSize,
    search,
    excludeGenres,
    selectedGenres,
  });
  if (!parsedInput.success) {
    return {
      ok: false,
      message: "Invalid candidate task app query.",
      data: null,
    };
  }

  const input = parsedInput.data;

  try {
    const skip = (input.page - 1) * input.pageSize;
    const where: Prisma.CandidateTaskAppWhereInput = {
      isTaken: input.isTaken,
      app: {
        is: {
          metadata: {
            is: {
              name: {
                contains: input.search.trim(),
                mode: "insensitive",
              },
              genre: {
                hasEvery: input.selectedGenres,
              },
              NOT: {
                genre: {
                  hasSome: input.excludeGenres,
                },
              },
            },
          },
        },
      },
    };

    const totalCount = await prisma.candidateTaskApp.count({ where });

    const candidateTaskApps = await prisma.candidateTaskApp.findMany({
      where,
      skip,
      take: input.pageSize,
      include: { app: true },
      orderBy: { id: "asc" },
    });

    return {
      ok: true,
      message: "Candidate task apps fetched successfully",
      data: {
        candidateTaskApps,
        totalCount,
        hasMore: skip + input.pageSize < totalCount,
        currentPage: input.page,
      },
    };
  } catch (error) {
    console.error("Error fetching candidate task apps:", error);
    return {
      ok: false,
      message: "Failed to fetch candidate task apps",
      data: null,
    };
  }
};

export const setCandidateTaskAppTakenStatus = async ({
  id,
  isTaken,
}: {
  id: string;
  isTaken: boolean;
}): Promise<ActionPayload<{ totalCount: number }>> => {
  const parsedInput = SetCandidateTaskAppTakenStatusInputSchema.safeParse({
    id,
    isTaken,
  });
  if (!parsedInput.success) {
    return {
      ok: false,
      message: "Invalid candidate task app taken status input.",
      data: null,
    };
  }

  try {
    await prisma.candidateTaskApp.update({
      where: { id: parsedInput.data.id },
      data: { isTaken: parsedInput.data.isTaken },
    });
    const totalCount = await prisma.candidateTaskApp.count({
      where: { isTaken: false },
    });
    return {
      ok: true,
      message: "Candidate task app taken status set successfully",
      data: { totalCount },
    };
  } catch (error) {
    console.error("Error setting candidate task app taken status:", error);
    return {
      ok: false,
      message: "Failed to set candidate task app taken status",
      data: null,
    };
  }
};

export const setCandidateTaskStatus = async ({
  id,
  taskIndex,
  status,
}: {
  id: string;
  taskIndex: number;
  status: z.infer<typeof CandidateTaskStatusSchema>;
}): Promise<ActionPayload<{ candidateTaskApp: CandidateTaskApp }>> => {
  const parsedInput = SetCandidateTaskStatusInputSchema.safeParse({
    id,
    taskIndex,
    status,
  });
  if (!parsedInput.success) {
    return {
      ok: false,
      message: "Invalid candidate task status input.",
      data: null,
    };
  }

  const input = parsedInput.data;

  try {
    const candidateTaskApp = await prisma.candidateTaskApp.findUnique({
      where: { id: input.id },
      include: { app: true },
    });

    if (!candidateTaskApp) {
      return {
        ok: false,
        message: "Candidate task app not found.",
        data: null,
      };
    }

    if (input.taskIndex >= candidateTaskApp.tasks.length) {
      return {
        ok: false,
        message: "Candidate task index is out of range.",
        data: null,
      };
    }

    await prisma.$runCommandRaw({
      update: "candidate_task_apps",
      updates: [
        {
          q: { _id: { $oid: input.id } },
          u: {
            $set: {
              [`tasks.${input.taskIndex}.status`]: input.status,
            },
          },
          multi: false,
        },
      ],
    });

    const updated = await prisma.candidateTaskApp.findUnique({
      where: { id: input.id },
      include: { app: true },
    });

    if (!updated) {
      return {
        ok: false,
        message: "Candidate task app not found.",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Candidate task status updated successfully",
      data: { candidateTaskApp: updated },
    };
  } catch (error) {
    console.error("Error setting candidate task status:", error);
    return {
      ok: false,
      message: "Failed to set candidate task status",
      data: null,
    };
  }
};

export const getCandidateTaskCapturePrefill = async ({
  candidateTaskAppId,
  taskIndex,
}: {
  candidateTaskAppId: string;
  taskIndex: number;
}): Promise<ActionPayload<CandidateTaskCapturePrefill>> => {
  const session = await requireAuth();
  if (!session?.user?.id) {
    return { ok: false, message: "User not authenticated.", data: null };
  }

  const parsedInput = GetCandidateTaskCapturePrefillInputSchema.safeParse({
    candidateTaskAppId,
    taskIndex,
  });
  if (!parsedInput.success) {
    return {
      ok: false,
      message: "Invalid candidate task prefill input.",
      data: null,
    };
  }

  const input = parsedInput.data;

  try {
    const candidateTaskApp = await prisma.candidateTaskApp.findUnique({
      where: { id: input.candidateTaskAppId },
      include: { app: true },
    });

    if (!candidateTaskApp) {
      return {
        ok: false,
        message: "Candidate task app not found.",
        data: null,
      };
    }

    const task = candidateTaskApp.tasks[input.taskIndex];
    if (!task) {
      return {
        ok: false,
        message: "Candidate task index is out of range.",
        data: null,
      };
    }

    if (task.status === "hidden") {
      return {
        ok: false,
        message: "This candidate task is hidden and cannot be started.",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Candidate task prefill found.",
      data: {
        candidateTaskAppId: candidateTaskApp.id,
        taskIndex: input.taskIndex,
        platform: candidateTaskApp.app.os,
        app: {
          name: candidateTaskApp.app.metadata.name,
          id: candidateTaskApp.app.packageName,
        },
        task: {
          description: task.description,
          status: task.status,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching candidate task capture prefill:", error);
    return {
      ok: false,
      message: "Failed to fetch candidate task prefill.",
      data: null,
    };
  }
};
