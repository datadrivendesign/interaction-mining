"use server";

import { prisma } from "@/lib/prisma";
import { App, Prisma } from "@prisma/client";
import { isObjectIdOrHexString } from "mongoose";
import { Platform } from "@/lib/utils";

export type AppItemList = {
  id: string;
  package: string;
  name: string;
  os: Platform;
};

export type AppInput = {
  packageName: string,
  category: {
    id: string,
    name: string,
  } | null,
  metadata: {
    company: string,
    name: string,
    cover: string,
    description: string,
    icon: string,
    rating: number,
    reviews: number,
    genre: string[],
    downloads: string,
    url: string,
  },
  os: Platform
}

export interface GetAppsParams {
  /** Simple full-text search (name, description, etc.) */
  query?: string;
  /** Deep-dive filters: any Prisma.AppWhereInput you want */
  where?: Prisma.AppWhereInput;
  /** Sort order (defaults to downloads desc) */
  orderBy?: Prisma.AppOrderByWithRelationInput;
  /** Pagination */
  page?: number;
  limit?: number;
}

export async function getApps({
  query,
  where = {},
  orderBy = { metadata: { downloads: "desc" } },
  page = 1,
  limit = 10,
}: GetAppsParams = {}) {
  // build a base “where” that overlays text search onto any custom filters
  const query_: Prisma.AppWhereInput = {
    ...where,
    ...(query || query !== ""
      ? {
          metadata: {
            is: {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        }
      : {}),
  };

  return prisma.app.findMany({
    where: query_,
    orderBy,
    take: limit,
    skip: limit ? (page - 1) * limit : undefined,
  });
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
      select: { id: true, metadata: true, packageName: true, os: true },
      orderBy: { id: "asc" },
    });

    return apps.map((app) => ({
      id: app.id,
      package: app.packageName,
      name: app.metadata.name,
      os: app.os
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

export async function checkIfAppExists(
  packageName: string, 
  os: Platform
): Promise<boolean> {
  if (!packageName) return false;

  try {
    const app = await prisma.app.findUnique({
      where: {
        packageName_os: { packageName, os }
      },
    });

    return !!app;
  } catch (error) {
    console.error("Failed to check if app exists:", error);
    return false;
  }
}

export async function saveApp(
  appData: Prisma.AppCreateInput
): Promise<{ ok: boolean; data: App | null }> {
  if (!appData || !appData.packageName) return { ok: false, data: null };

  try {
    const existingApp = await prisma.app.findFirst({
      where: {
        packageName: appData.packageName,
        os: appData.os
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
        os: appData.os,
        metadata: {
          company: appData.metadata.company!,
          name: appData.metadata.name!,
          cover: appData.metadata.cover!,
          description: appData.metadata.description!,
          icon: appData.metadata.icon!,
          rating: appData.metadata.rating!,
          reviews: appData.metadata.reviews!,
          genre: appData.metadata.genre!,
          downloads: appData.metadata.downloads!,
          url: appData.metadata.url!,
        },
      },
    });

    return { ok: true, data: newApp };
  } catch (error) {
    console.error("Failed to save scraped app:", error);
    return { ok: false, data: error as App | null };
  }
}
