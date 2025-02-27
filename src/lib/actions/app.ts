"use server";

import { prisma } from "@/lib/prisma";
import { App, Prisma } from "@prisma/client";
import { isObjectIdOrHexString } from "mongoose";

interface GetAppParams {
  limit?: number;
  page?: number;
  query?: string;
  order?: "name" | "rating" | "downloads";
  sort?: "asc" | "desc";
}

export async function getApps({
  limit,
  page = 1,
  query = "",
  order = "downloads",
  sort = "desc",
}: GetAppParams = {}) {
  let app: App[] = [];

  try {
    const options = {
      where: {
        metadata: {
          is: {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
        },
      },
      orderBy: {
        metadata: {
          [order]: sort,
        },
      },
    } as Prisma.AppFindManyArgs;

    // if limit is not provided, return all apps
    if (limit) {
      options.take = limit;
    }

    // if page and limit are provided, calculate the offset
    if (page && limit) {
      options.skip = (page - 1) * limit;
    }

    app = await prisma.app.findMany(options);
  } catch (err: any) {
    console.error(err);
    throw new Error("Failed to fetch apps.");
  }

  return app;
}

export async function getApp(id: string): Promise<App | null> {
  let app: App | null = {} as App;

  if (!isObjectIdOrHexString(id)) {
    return null;
  }

  try {
    app = await prisma.app.findUnique({
      where: {
        id,
      },
    });
  } catch {
    throw new Error("Failed to fetch app.");
  }

  return app;
}
