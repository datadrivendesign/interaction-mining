"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Platform } from "@/lib/utils";
import { ActionPayload } from "./types";
import { requireAuth } from "../auth/auth";
import { checkIfAppExists, saveApp } from "./app";
import { getAndroidApp } from "./store-scraper";

export type CrawlRequest = Prisma.CrawlRequestGetPayload<{
  include: { app: true; capture: true };
}>;

const CreateCrawlRequestInputSchema = z.object({
  targetInput: z.string().trim().min(1).max(2048),
  description: z.string().trim().min(1).max(200),
});

/**
 * Best-effort parse of a Play Store URL or bare package name.
 * Mirrors the parsing already used in capture/new/components/add-app-form.tsx.
 */
function parsePlayStorePackageName(input: string): string | null {
  try {
    const url = new URL(input);
    if (!/(^|\.)play\.google\.com$/.test(url.hostname)) {
      return null;
    }
    return url.searchParams.get("id")?.trim() || null;
  } catch {
    // not a URL — treat as a bare package name if it looks like one
    // (reverse-domain style, e.g. com.whatsapp)
    return /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(input)
      ? input
      : null;
  }
}

/**
 * Creates a new crawl request for dcc to pick up, resolving the target as a
 * Play Store app when possible and falling back to a generic URL target.
 * @param targetInput Raw pasted input: a Play Store URL/package name, or a URL.
 * @param description Task description for dcc to perform.
 * @returns ActionPayload of the created crawl request.
 */
export async function createCrawlRequest({
  targetInput,
  description,
}: {
  targetInput: string;
  description: string;
}): Promise<ActionPayload<{ crawlRequestId: string }>> {
  const parsedInput = CreateCrawlRequestInputSchema.safeParse({
    targetInput,
    description,
  });
  if (!parsedInput.success) {
    return { ok: false, message: "Invalid crawl request input.", data: null };
  }
  const input = parsedInput.data;

  const session = await requireAuth();
  if (!session || !session.user || !session.user.id) {
    return { ok: false, message: "User not authenticated.", data: null };
  }

  try {
    const packageName = parsePlayStorePackageName(input.targetInput);

    let appId: string | null = null;
    if (packageName) {
      const existing = await checkIfAppExists(packageName, Platform.ANDROID);
      if (existing) {
        appId = existing.id;
      } else {
        const fetched = await getAndroidApp({ appId: packageName });
        if (fetched.ok && fetched.data) {
          const saved = await saveApp(
            fetched.data as Prisma.AppCreateInput,
          );
          if (saved.ok && saved.data) {
            appId = saved.data.id;
          }
        }
      }
    }

    const crawlRequest = await prisma.crawlRequest.create({
      data: {
        user: { connect: { id: session.user.id } },
        targetType: appId ? "PLAY_STORE_APP" : "URL",
        targetInput: input.targetInput,
        ...(appId ? { app: { connect: { id: appId } } } : {}),
        description: input.description,
      },
    });

    await dispatchCrawlRequestToDCC(crawlRequest.id);

    return {
      ok: true,
      message: "Crawl request created.",
      data: { crawlRequestId: crawlRequest.id },
    };
  } catch (error) {
    console.error("Error creating crawl request:", error);
    return {
      ok: false,
      message: "Failed to create crawl request.",
      data: null,
    };
  }
}

/**
 * Hands a queued crawl request off to dcc. This is the integration seam with
 * dcc's own server — the payload shape and auth scheme here are provisional
 * until dcc's real API contract is finalized.
 * @param crawlRequestId Id of the crawl request to dispatch.
 */
export async function dispatchCrawlRequestToDCC(
  crawlRequestId: string,
): Promise<void> {
  const dispatchUrl = process.env.DCC_DISPATCH_URL;
  if (!dispatchUrl) {
    console.info(
      `dcc dispatch not configured (DCC_DISPATCH_URL unset); leaving crawl request ${crawlRequestId} queued.`,
    );
    return;
  }

  const crawlRequest = await prisma.crawlRequest.findUnique({
    where: { id: crawlRequestId },
    include: { app: true },
  });
  if (!crawlRequest) {
    return;
  }

  try {
    const response = await fetch(dispatchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DCC_AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        crawlRequestId: crawlRequest.id,
        targetType: crawlRequest.targetType,
        targetInput: crawlRequest.targetInput,
        description: crawlRequest.description,
        ...(crawlRequest.app
          ? { appId: crawlRequest.appId, os: crawlRequest.app.os }
          : {}),
      }),
    });

    if (!response.ok) {
      throw new Error(`dcc dispatch responded with ${response.status}`);
    }

    await prisma.crawlRequest.update({
      where: { id: crawlRequestId },
      data: { status: "DISPATCHED" },
    });
  } catch (error) {
    console.error(`Failed to dispatch crawl request ${crawlRequestId}:`, error);
    await prisma.crawlRequest.update({
      where: { id: crawlRequestId },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

/**
 * Fetches a user's crawl requests, most recent first.
 * @param userId Id of the user to fetch crawl requests for.
 * @returns ActionPayload of list of crawl requests.
 */
export async function getCrawlRequestsForUser(
  userId: string,
): Promise<ActionPayload<CrawlRequest[]>> {
  const session = await requireAuth();
  if (!session || !session.user || !session.user.id) {
    return { ok: false, message: "User not authenticated.", data: null };
  }
  if (session.user.id !== userId) {
    return { ok: false, message: "User not authorized.", data: null };
  }

  try {
    const crawlRequests = await prisma.crawlRequest.findMany({
      where: { userId },
      include: { app: true, capture: true },
      orderBy: { id: "desc" },
    });
    return {
      ok: true,
      message: "Crawl requests found.",
      data: crawlRequests,
    };
  } catch (error) {
    console.error("Error fetching crawl requests:", error);
    return {
      ok: false,
      message: "Failed to fetch crawl requests.",
      data: null,
    };
  }
}
