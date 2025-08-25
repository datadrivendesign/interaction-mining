"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ActionPayload } from "./types";

export type CandidateTaskApp = Prisma.CandidateTaskAppGetPayload<{
  include: {
    app: true;
  };
}>;

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
  try {
    const skip = (page - 1) * pageSize;
    const where: Prisma.CandidateTaskAppWhereInput = {
      isTaken: isTaken,
      app: {
        is: {
          metadata: {
            is: {
              name: {
                contains: search.trim(),
                mode: "insensitive",
              },
              genre: {
                hasEvery: selectedGenres,
              },
              NOT: {
                genre: {
                  hasSome: excludeGenres,
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
      take: pageSize,
      include: { app: true },
      orderBy: { id: "asc" },
    });

    return {
      ok: true,
      message: "Candidate task apps fetched successfully",
      data: {
        candidateTaskApps,
        totalCount,
        hasMore: skip + pageSize < totalCount,
        currentPage: page,
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
