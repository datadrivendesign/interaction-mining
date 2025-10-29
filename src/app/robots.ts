import { isDevelopment, isProduction } from "@/lib/utils/env";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const isDev = isDevelopment();

  // Get the current deployment URL
  const baseUrl =
    process.env.NEXT_PUBLIC_DEPLOYMENT_URL ||
    "https://www.interactionmining.org";

  if (isDev) {
    // Block all crawlers from dev site
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      sitemap: undefined, // No sitemap for dev
    };
  }

  // Production site - allow crawling
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/*",
          "/_next/",
          "/admin/*",
          "/candidates",
          "/capture/new",
          "/capture/*/start",
          "/capture/*/upload",
          "/capture/*/edit",
          "/capture/*/evaluate",
          "/dashboard",
          "/sign-in",
          "/sign-out",
          "/user/",
        ],
      },
      // Block AI crawlers and training bots
      {
        userAgent: "GPTBot",
        disallow: "/", // Block AI crawlers
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/", // Block ChatGPT crawlers
      },
      {
        userAgent: "anthropic-ai",
        disallow: "/", // Block Anthropic crawlers
      },
      {
        userAgent: "PerplexityBot",
        disallow: "/", // Block Perplexity crawlers
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
