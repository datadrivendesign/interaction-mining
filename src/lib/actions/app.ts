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

export type AppItemList = {
  id: string;
  package: string;
  name: string;
};

export async function getApps({
  limit,
  page = 1,
  query = "",
  order = "downloads",
  sort = "desc",
}: GetAppParams = {}) {
  let app: App[] = [];

  try {
    const options: Prisma.AppFindManyArgs = {
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

export async function getAllApps(): Promise<AppItemList[]> {
  try {
    const apps = await prisma.app.findMany({
      select: { id: true, metadata: true, packageName: true },
      orderBy: { id: "asc" },
    });

    return apps.map((app) => ({
      id: app.id,
      package: app.packageName,
      name: app.metadata.name,
    }));
  } catch (error) {
    console.error("Failed to fetch apps:", error);
    return [];
  }
}

export async function getAppByPackageName(
  packageName: string
): Promise<App | null> {
  if (!packageName) return null;

  try {
    const app = await prisma.app.findFirst({
      where: {
        packageName,
      },
    });

    return app;
  } catch (error) {
    console.error("Failed to fetch app by package name:", error);
    return null;
  }
}

export async function checkIfAppExists(packageName: string): Promise<boolean> {
  if (!packageName) return false;

  try {
    const app = await prisma.app.findUnique({
      where: { packageName },
    });

    return !!app;
  } catch (error) {
    console.error("Failed to check if app exists:", error);
    return false;
  }
}

export async function saveApp(
  appData: App
): Promise<{ ok: boolean; data: App | null }> {
  if (!appData || !appData.packageName) return { ok: false, data: null };

  try {
    const existingApp = await prisma.app.findFirst({
      where: {
        packageName: appData.packageName,
      },
    });

    if (existingApp) {
      console.log("App already exists:", existingApp.packageName);
      return { ok: true, data: existingApp };
    }

    const newApp = await prisma.app.create({
      data: {
        packageName: appData.packageName,
        category: appData.category || null,
        metadata: {
          company: appData.metadata.company,
          name: appData.metadata.name,
          cover: appData.metadata.cover,
          description: appData.metadata.description,
          icon: appData.metadata.icon,
          rating: appData.metadata.rating,
          reviews: appData.metadata.reviews,
          genre: appData.metadata.genre,
          downloads: appData.metadata.downloads,
          url: appData.metadata.url,
        },
        v: appData.v ?? 0,
      },
    });

    return { ok: true, data: newApp };
  } catch (error) {
    console.error("Failed to save scraped app:", error);
    return { ok: false, data: error as App | null };
  }
}
