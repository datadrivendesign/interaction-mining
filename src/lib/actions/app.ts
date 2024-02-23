"use server";

import { prisma } from "@/lib/prisma";
import { App } from "@prisma/client";
import { isObjectIdOrHexString } from "mongoose";

interface GetAppParams {
  limit?: number;
  page?: number;
  query?: string;
  order?: "name" | "rating" | "downloads";
  sort?: "asc" | "desc";
}

export async function getApps({
  limit = 10,
  page = 1,
  query = "",
  order = "downloads",
  sort = "desc",
}: GetAppParams = {}) {
  let app: App[] = [];

  try {
    app = await prisma.app.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      orderBy: {
        [order]: sort,
      },
      take: limit,
      skip: (page - 1) * limit,
    });
  } catch {
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
