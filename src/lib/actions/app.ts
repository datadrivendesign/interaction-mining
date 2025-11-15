"use server";

import { prisma } from "@/lib/prisma";
import { App, Prisma, Role } from "@prisma/client";
import { isObjectIdOrHexString } from "mongoose";
import { Platform } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { isProduction } from "@/lib/utils/env";

export type AppItemList = {
  id: string;
  package: string;
  name: string;
  os: Platform;
};

export type AppInput = {
  packageName: string;
  category: {
    id: string;
    name: string;
  } | null;
  metadata: {
    company: string;
    name: string;
    cover: string;
    description: string;
    icon: string;
    rating: number;
    reviews: number;
    genre: string[];
    downloads: string;
    url: string;
  };
  os: Platform;
};

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
  /** Allow iOS apps in production for non-admins (only for trusted contexts like capture form) */
  allowIOS?: boolean;
}
/**
 * Fetches list of apps from the database.
 * @param query - Simple full-text search (name, description, etc.)
 * @param where - Deep-dive filters: any Prisma.AppWhereInput you want
 * @param orderBy - Sort order (defaults to downloads desc)
 * @param page - requested page number
 * @param limit - requested number of apps to fetch per page
 * @param allowIOS - Allow iOS apps in production for non-admins (only for trusted contexts like capture form)
 * @returns list of apps
 */
export async function getApps({
  query,
  where = {},
  orderBy = { metadata: { downloads: "desc" } },
  page = 1,
  limit = 10,
  allowIOS = false, // FIXME: temporarily disable some iOS apps in prod for now
}: GetAppsParams = {}) {
  // Server-side iOS restriction: enforce unless allowIOS is explicitly true
  let osFilter = where.os ?? Platform.ANDROID;

  // Check if iOS is being requested
  const isRequestingIOS = where.os === Platform.IOS;
  if (isRequestingIOS && !allowIOS) {
    const session = await auth();
    const isProd = isProduction();
    const isAdmin = session?.user?.role === Role.ADMIN;

    // If iOS requested in prod by non-admins without allowIOS, force Android
    if (isProd && !isAdmin) {
      osFilter = Platform.ANDROID;
    }
  }

  // Create filtered where clause without mutating original
  const filteredWhere: Prisma.AppWhereInput = {
    ...where,
    os: osFilter,
  };

  // build a base "where" that overlays text search onto any custom filters
  const query_: Prisma.AppWhereInput = {
    ...filteredWhere,
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

/**
 * Fetches count of apps from the database.
 * @param query - Simple full-text search (name, description, etc.)
 * @param where - Deep-dive filters: any Prisma.AppWhereInput you want
 * @param allowIOS - allow iOS apps in prod for non-admins (this is temporary since ios is currently in testing)
 * @returns count of apps
 */
export async function getAppsCount({
  query,
  where = {},
  allowIOS = false, // FIXME: temporarily disable some iOS apps in prod for now
}: GetAppsParams = {}) {
  // Server-side iOS restriction: enforce unless allowIOS is explicitly true
  let osFilter = where.os ?? Platform.ANDROID;

  // Check if iOS is being requested
  const isRequestingIOS = where.os === Platform.IOS;

  if (isRequestingIOS && !allowIOS) {
    const session = await auth();
    const isProd = isProduction();
    const isAdmin = session?.user?.role === Role.ADMIN;

    // If iOS requested in prod by non-admins without allowIOS, force Android
    if (isProd && !isAdmin) {
      osFilter = Platform.ANDROID;
    }
  }

  // Create filtered where clause without mutating original
  const filteredWhere: Prisma.AppWhereInput = {
    ...where,
    os: osFilter,
  };

  // build a base "where" that overlays text search onto any custom filters
  const query_: Prisma.AppWhereInput = {
    ...filteredWhere,
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
  return prisma.app.count({
    where: query_,
  });
}

/**
 * Fetches a single app from the database.
 * @param id - id of the app
 * @returns app
 */
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

/**
 * Fetches list of all apps from the database.
 * @returns list of apps
 */
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
      os: app.os,
    }));
  } catch (error) {
    console.error("Failed to fetch apps:", error);
    return [];
  }
}

/**
 * Fetches a single app from the database by package name.
 * @param packageName - package name of the app
 * @returns app
 */
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

/**
 * Checks if an app exists in the database by package name and OS.
 * @param packageName - package name of the app
 * @param os - OS of the app
 * @returns app
 */
export async function checkIfAppExists(
  packageName: string,
  os: Platform
): Promise<App | null> {
  if (!packageName) return null;

  try {
    const app = await prisma.app.findUnique({
      where: {
        packageName_os: { packageName, os },
      },
    });

    return app;
  } catch (error) {
    console.error("Failed to check if app exists:", error);
    return null;
  }
}

/**
 * Saves an app to the database.
 * @param appData - app data to save
 * @returns app
 */
export async function saveApp(
  appData: Prisma.AppCreateInput
): Promise<{ ok: boolean; data: App | null }> {
  if (!appData || !appData.packageName) return { ok: false, data: null };

  try {
    const existingApp = await prisma.app.findFirst({
      where: {
        packageName: appData.packageName,
        os: appData.os,
      },
    });

    if (existingApp) {
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
