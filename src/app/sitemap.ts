import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { Platform } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_DEPLOYMENT_URL ||
    "https://www.interactionmining.org";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contribute`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/legal/copyright`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/legal/tos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/archive/rico`,
      lastModified: new Date(),
      changeFrequency: "never",
      priority: 0.1,
    },
    {
      url: `${baseUrl}/archive/erica`,
      lastModified: new Date(),
      changeFrequency: "never",
      priority: 0.1,
    },
    {
      url: `${baseUrl}/archive/zipt`,
      lastModified: new Date(),
      changeFrequency: "never",
      priority: 0.1,
    },
  ];

  // Dynamic pages - get public apps
  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    // Get apps with traces (Android only for consistency)
    const publicApps = await prisma.app.findMany({
      where: {
        Trace: { some: {} },
        os: Platform.ANDROID,
      },
      select: {
        id: true,
        packageName: true,
        os: true,
        metadata: {
          select: {
            name: true,
          },
        },
        // Get the most recent trace creation date
        Trace: {
          select: {
            created: true,
          },
          orderBy: {
            created: "desc",
          },
          take: 1,
        },
      },
      take: 100, // Limit to prevent sitemap from being too large
    });

    // Add app pages (these are public - in (default) folder)
    dynamicPages = publicApps.map((app) => ({
      url: `${baseUrl}/app/${app.id}`,
      lastModified: app.Trace[0]?.created || new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error fetching dynamic pages for sitemap:", error);
    // Continue with static pages only if database query fails
  }

  return [...staticPages, ...dynamicPages];
}
