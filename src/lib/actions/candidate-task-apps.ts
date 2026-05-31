"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ActionPayload } from "./types";
import { z } from "zod";

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
