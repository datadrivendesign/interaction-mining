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
  isTaken,
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
    const startIndex = (page - 1) * pageSize;
    const candidateTaskApps = await prisma.candidateTaskApp.findMany({
      where: {
        isTaken,
        ...(search.trim()
          ? {
              app: {
                metadata: {
                  name: {
                    contains: search,
                  },
                },
              },
            }
          : {}),
        ...(excludeGenres.length > 0
          ? {
              app: {
                metadata: {
                  genre: {
                    notIn: excludeGenres,
                  },
                },
              },
            }
          : {}),
        ...(selectedGenres.length > 0
          ? {
              app: {
                metadata: {
                  genre: {
                    in: selectedGenres,
                  },
                },
              },
            }
          : {}),
      },
      include: {
        app: true,
      },
    });

    if (!candidateTaskApps) {
      return {
        ok: false,
        message: "No candidate task apps found",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Candidate task apps fetched successfully",
      data: candidateTaskApps,
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
