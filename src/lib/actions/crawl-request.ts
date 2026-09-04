"use server";

import fs from "node:fs";
import path from "node:path";
import { Prisma, Role } from "@prisma/client";
import { isValidObjectId } from "mongoose";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Platform } from "@/lib/utils";
import { s3 } from "@/lib/aws";
import { ActionPayload } from "./types";
import { requireAuth } from "../auth/auth";
import { checkIfAppExists, saveApp } from "./app";
import { getAndroidApp } from "./store-scraper";

export type CrawlRequest = Prisma.CrawlRequestGetPayload<{
  include: { app: true; capture: true };
}>;

export interface CrawlStepAction {
  type: string;
  text?: string;
  target?: {
    by?: string;
    index?: number;
    selector?: string;
    point?: [number, number];
    [key: string]: unknown;
  };
  direction?: string;
  deltaX?: number;
  deltaY?: number;
  status?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface CrawlStep {
  step: number;
  reason?: string;
  reflection?: string;
  action: CrawlStepAction;
  latencyMs?: number;
  capturedAt?: string;
  screenshotUrl?: string | null;
}

export interface CrawlTraceData {
  status: string;
  steps: CrawlStep[];
  findings?: string[];
  apps?: Array<{ locator: string }>;
  error?: string | null;
}

export interface CrawlTraceResult {
  crawlRequest: CrawlRequest;
  trace: CrawlTraceData | null;
}

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

  if (crawlRequest.targetType !== "URL") {
    console.info(
      `dcc dispatch skipped for crawl request ${crawlRequestId}: targetType ${crawlRequest.targetType} is not yet supported (URL only in v1); leaving queued.`,
    );
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
      signal: AbortSignal.timeout(10_000),
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

/**
 * Attempts to locate a screenshot on disk for a given step index.
 */
async function findStepScreenshot(
  traceDir: string,
  stepIndex: number,
): Promise<string | null> {
  const paddedIndex = String(stepIndex).padStart(4, "0");
  const unpaddedIndex = String(stepIndex);

  const candidatePaths = [
    path.join(traceDir, "steps", paddedIndex, "screenshot.png"),
    path.join(traceDir, "steps", unpaddedIndex, "screenshot.png"),
    path.join(traceDir, "steps", `step-${stepIndex}.png`),
    path.join(traceDir, "steps", `step-${paddedIndex}.png`),
    path.join(traceDir, `step-${stepIndex}.png`),
    path.join(traceDir, `step-${paddedIndex}.png`),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        const buffer = await fs.promises.readFile(candidate);
        return `data:image/png;base64,${buffer.toString("base64")}`;
      } catch (err) {
        console.warn(`Failed to read screenshot at ${candidate}:`, err);
      }
    }
  }

  return null;
}

/**
 * Resolves the trace directory on the local filesystem if it exists.
 */
async function findLocalTraceDir(
  crawlRequestId: string,
  recordedTraceDir?: string | null,
): Promise<string | null> {
  if (recordedTraceDir) {
    if (fs.existsSync(recordedTraceDir)) {
      return recordedTraceDir;
    }
    const baseName = path.basename(recordedTraceDir);
    const homeDir = process.env.HOME || "";
    const fromHome = path.join(homeDir, ".dcc", "traces", baseName);
    if (fs.existsSync(fromHome)) {
      return fromHome;
    }
    const fromCwd = path.join(process.cwd(), recordedTraceDir);
    if (fs.existsSync(fromCwd)) {
      return fromCwd;
    }
  }

  // Check ~/.dcc/traces for crawl-${crawlRequestId}*
  const homeDir = process.env.HOME || "";
  const dccTracesDir = path.join(homeDir, ".dcc", "traces");
  if (fs.existsSync(dccTracesDir)) {
    try {
      const entries = await fs.promises.readdir(dccTracesDir, { withFileTypes: true });
      const matches = entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith(`crawl-${crawlRequestId}`))
        .map((entry) => path.join(dccTracesDir, entry.name));

      if (matches.length > 0) {
        matches.sort((a, b) => {
          const statA = fs.statSync(a);
          const statB = fs.statSync(b);
          return statB.mtimeMs - statA.mtimeMs;
        });
        return matches[0];
      }
    } catch (err) {
      console.warn("Failed to search ~/.dcc/traces:", err);
    }
  }

  return null;
}

/**
 * Attempts to load crawl trace data from S3/MinIO.
 */
async function loadTraceFromS3(
  crawlRequestId: string,
): Promise<CrawlTraceData | null> {
  const bucket = process.env._AWS_UPLOAD_BUCKET;
  if (!bucket) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: `traces/crawls/${crawlRequestId}/result.json`,
    });
    const response = await s3.send(command);
    const text = await response.Body?.transformToString();
    if (!text) return null;

    const data = JSON.parse(text);
    const steps: CrawlStep[] = (data.steps || []).map((step: CrawlStep) => {
      let screenshotUrl = step.screenshotUrl || null;
      if (!screenshotUrl) {
        const stepKey = `traces/crawls/${crawlRequestId}/steps/${step.step}.png`;
        if (process.env.USE_MINIO_STORE === "true") {
          screenshotUrl = `${process.env.MINIO_ENDPOINT}/${bucket}/${stepKey}`;
        } else if (process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL) {
          screenshotUrl = `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${stepKey}`;
        }
      }
      return {
        ...step,
        screenshotUrl,
      };
    });

    return {
      status: data.status || "unknown",
      error: data.error || null,
      findings: data.findings || [],
      apps: data.apps || [],
      steps,
    };
  } catch {
    return null;
  }
}

/**
 * Loads crawl trace data from a local directory containing result.json and steps.
 */
async function loadTraceFromDisk(
  traceDir: string,
): Promise<CrawlTraceData | null> {
  const resultPath = path.join(traceDir, "result.json");
  if (!fs.existsSync(resultPath)) return null;

  try {
    const raw = await fs.promises.readFile(resultPath, "utf-8");
    const data = JSON.parse(raw);

    const steps: CrawlStep[] = await Promise.all(
      (data.steps || []).map(async (step: Record<string, unknown>, idx: number) => {
        const stepNum = typeof step.step === "number" ? step.step : idx;
        let screenshotUrl: string | null = null;

        if (typeof step.screenshotBase64 === "string" && step.screenshotBase64) {
          screenshotUrl = `data:image/png;base64,${step.screenshotBase64}`;
        } else if (typeof step.screenshotUrl === "string" && step.screenshotUrl) {
          screenshotUrl = step.screenshotUrl;
        } else {
          screenshotUrl = await findStepScreenshot(traceDir, stepNum);
        }

        return {
          step: stepNum,
          reason: typeof step.reason === "string" ? step.reason : undefined,
          reflection: typeof step.reflection === "string" ? step.reflection : undefined,
          action: (step.action as CrawlStepAction) || { type: "unknown" },
          latencyMs: typeof step.latencyMs === "number" ? step.latencyMs : undefined,
          capturedAt: typeof step.capturedAt === "string" ? step.capturedAt : undefined,
          screenshotUrl,
        };
      }),
    );

    return {
      status: typeof data.status === "string" ? data.status : "unknown",
      error: typeof data.error === "string" ? data.error : null,
      findings: Array.isArray(data.findings) ? data.findings : [],
      apps: Array.isArray(data.apps) ? data.apps : [],
      steps,
    };
  } catch (err) {
    console.error("Failed to parse trace result from disk:", err);
    return null;
  }
}

/**
 * Fetches a crawl request and its associated trace run details.
 * @param crawlRequestId Id of the crawl request to inspect.
 */
export async function getCrawlTrace(
  crawlRequestId: string,
): Promise<ActionPayload<CrawlTraceResult>> {
  if (!isValidObjectId(crawlRequestId)) {
    return { ok: false, message: "Invalid crawl request ID.", data: null };
  }

  const session = await requireAuth();
  if (!session || !session.user || !session.user.id) {
    return { ok: false, message: "User not authenticated.", data: null };
  }

  try {
    const crawlRequest = await prisma.crawlRequest.findUnique({
      where: { id: crawlRequestId },
      include: { app: true, capture: true },
    });

    if (!crawlRequest) {
      return { ok: false, message: "Crawl request not found.", data: null };
    }

    if (
      crawlRequest.userId !== session.user.id &&
      session.user.role !== Role.ADMIN
    ) {
      return { ok: false, message: "Unauthorized.", data: null };
    }

    // Try S3 first
    let trace = await loadTraceFromS3(crawlRequestId);

    // If not in S3, check local filesystem
    if (!trace) {
      const localDir = await findLocalTraceDir(crawlRequestId, crawlRequest.traceDir);
      if (localDir) {
        trace = await loadTraceFromDisk(localDir);
      }
    }

    // Fallback if no trace file exists yet
    if (!trace) {
      trace = {
        status: crawlRequest.status.toLowerCase(),
        error:
          crawlRequest.error ??
          (crawlRequest.status === "FAILED"
            ? "Crawl failed before recording steps."
            : null),
        steps: [],
        findings: [],
      };
    }

    return {
      ok: true,
      message: "Crawl trace retrieved.",
      data: {
        crawlRequest,
        trace,
      },
    };
  } catch (error) {
    console.error("Error fetching crawl trace:", error);
    return {
      ok: false,
      message: "Failed to fetch crawl trace.",
      data: null,
    };
  }
}

