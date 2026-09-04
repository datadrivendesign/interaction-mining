"use server";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { CrawlRequestStatus, CrawlTargetType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/aws";
import { generateSignedCloudFrontURL } from "@/lib/aws/s3/server";
import { requireAuth } from "../auth/auth";
import { ActionPayload } from "./types";

export interface CrawlTraceStepAction {
  type: string;
  text?: string;
  target?: {
    by: string;
    index?: number;
    [key: string]: unknown;
  };
  status?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface CrawlTraceStep {
  step: number;
  reason?: string;
  reflection?: string;
  action?: CrawlTraceStepAction;
  latencyMs?: number;
  capturedAt?: string;
  screenshotUrl?: string;
  screenshotKey?: string;
  screenshotBase64?: string;
  [key: string]: unknown;
}

export interface CrawlTraceRequestMetadata {
  id: string;
  status: CrawlRequestStatus;
  targetType: CrawlTargetType;
  targetInput: string;
  description: string;
  error: string | null;
  traceDir: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrawlTraceData {
  crawlRequestId: string;
  status: string;
  error?: string | null;
  targetInput: string;
  description: string;
  traceDir?: string | null;
  steps: CrawlTraceStep[];
  findings?: unknown[];
  apps?: unknown[];
  crawlRequest?: CrawlTraceRequestMetadata;
  [key: string]: unknown;
}

const ObjectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i);

async function resolveStepScreenshotUrl(
  crawlRequestId: string,
  stepNum: number,
  existingUrl?: string,
  existingKey?: string,
): Promise<{ screenshotUrl: string; screenshotKey: string }> {
  const stepKey =
    existingKey ?? `traces/crawls/${crawlRequestId}/steps/${stepNum}.png`;

  if (process.env.USE_MINIO_STORE === "true") {
    return {
      screenshotUrl: `${process.env.MINIO_ENDPOINT}/${process.env._AWS_UPLOAD_BUCKET}/${stepKey}`,
      screenshotKey: stepKey,
    };
  }

  // Attempt to generate signed CloudFront URL if key pair is configured
  if (
    process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL &&
    process.env._AWS_CLOUDFRONT_KEY_PAIR_ID &&
    process.env._AWS_CLOUDFRONT_PRIVATE_KEY
  ) {
    try {
      const signed = await generateSignedCloudFrontURL(stepKey);
      if (signed.ok && signed.data?.signedUrl) {
        return {
          screenshotUrl: signed.data.signedUrl,
          screenshotKey: stepKey,
        };
      }
    } catch {
      // fall back to public url
    }
  }

  if (process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL) {
    return {
      screenshotUrl: `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${stepKey}`,
      screenshotKey: stepKey,
    };
  }

  if (process.env._AWS_UPLOAD_BUCKET) {
    const region = process.env._AWS_REGION || "us-east-1";
    return {
      screenshotUrl: `https://${process.env._AWS_UPLOAD_BUCKET}.s3.${region}.amazonaws.com/${stepKey}`,
      screenshotKey: stepKey,
    };
  }

  return {
    screenshotUrl: existingUrl ?? `/${stepKey}`,
    screenshotKey: stepKey,
  };
}

/**
 * Retrieves DCC crawl trace data for a given crawl request.
 * 1. Verifies session user owns the crawl request.
 * 2. Checks S3 at traces/crawls/${crawlRequestId}/result.json with signed/CloudFront screenshot URLs.
 * 3. Fallback: reads result.json and screenshots from local disk (as base64 data URLs)
 *    if traceDir exists locally.
 *
 * @param crawlRequestId MongoDB ID of the crawl request.
 * @returns ActionPayload containing CrawlTraceData or null.
 */
export async function getCrawlTrace(
  crawlRequestId: string,
): Promise<ActionPayload<CrawlTraceData>> {
  const session = await requireAuth();
  if (!session || !session.user || !session.user.id) {
    return { ok: false, message: "User not authenticated.", data: null };
  }

  if (!ObjectIdSchema.safeParse(crawlRequestId).success) {
    return { ok: false, message: "Invalid crawl request ID.", data: null };
  }

  try {
    const crawlRequest = await prisma.crawlRequest.findUnique({
      where: { id: crawlRequestId },
    });
    if (!crawlRequest) {
      return { ok: false, message: "Crawl request not found.", data: null };
    }

    if (crawlRequest.userId !== session.user.id) {
      return { ok: false, message: "User not authorized.", data: null };
    }

    let traceData: CrawlTraceData | null = null;
    const s3ResultKey = `traces/crawls/${crawlRequestId}/result.json`;

    // 1. Check S3
    if (process.env._AWS_UPLOAD_BUCKET) {
      try {
        const getCommand = new GetObjectCommand({
          Bucket: process.env._AWS_UPLOAD_BUCKET,
          Key: s3ResultKey,
        });
        const s3Response = await s3.send(getCommand);
        if (s3Response.Body) {
          const rawText = await s3Response.Body.transformToString();
          const parsed = JSON.parse(rawText) as Record<string, unknown>;

          const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : [];
          const steps: CrawlTraceStep[] = await Promise.all(
            rawSteps.map(async (item, i) => {
              const rawStep = (item && typeof item === "object"
                ? item
                : {}) as Record<string, unknown>;
              const stepNum =
                typeof rawStep.step === "number" ? rawStep.step : i;
              const { screenshotUrl, screenshotKey } =
                await resolveStepScreenshotUrl(
                  crawlRequestId,
                  stepNum,
                  typeof rawStep.screenshotUrl === "string"
                    ? rawStep.screenshotUrl
                    : undefined,
                  typeof rawStep.screenshotKey === "string"
                    ? rawStep.screenshotKey
                    : undefined,
                );

              return {
                step: stepNum,
                ...rawStep,
                screenshotUrl,
                screenshotKey,
              } as CrawlTraceStep;
            }),
          );

          traceData = {
            crawlRequestId: crawlRequest.id,
            status:
              typeof parsed.status === "string"
                ? parsed.status
                : crawlRequest.status,
            error:
              typeof parsed.error === "string"
                ? parsed.error
                : crawlRequest.error,
            targetInput: crawlRequest.targetInput,
            description: crawlRequest.description,
            traceDir: crawlRequest.traceDir,
            steps,
            findings: Array.isArray(parsed.findings) ? parsed.findings : [],
            apps: Array.isArray(parsed.apps) ? parsed.apps : [],
            ...parsed,
            crawlRequest: {
              id: crawlRequest.id,
              status: crawlRequest.status,
              targetType: crawlRequest.targetType,
              targetInput: crawlRequest.targetInput,
              description: crawlRequest.description,
              error: crawlRequest.error,
              traceDir: crawlRequest.traceDir,
              createdAt: crawlRequest.createdAt,
              updatedAt: crawlRequest.updatedAt,
            },
          };
        }
      } catch {
        // S3 result not available or failed -> fall back to local disk
      }
    }

    // 2. Fallback to local machine disk
    if (!traceData && crawlRequest.traceDir) {
      let resolvedDir = crawlRequest.traceDir;
      if (resolvedDir.startsWith("~/")) {
        resolvedDir = path.join(os.homedir(), resolvedDir.slice(2));
      }

      const resultFilePath = path.join(resolvedDir, "result.json");
      try {
        const rawText = await fs.readFile(resultFilePath, "utf8");
        const parsed = JSON.parse(rawText) as Record<string, unknown>;

        const rawSteps = Array.isArray(parsed.steps) ? parsed.steps : [];
        const steps: CrawlTraceStep[] = [];

        for (let i = 0; i < rawSteps.length; i++) {
          const rawStep = (rawSteps[i] && typeof rawSteps[i] === "object"
            ? rawSteps[i]
            : {}) as Record<string, unknown>;
          const stepNum =
            typeof rawStep.step === "number" ? rawStep.step : i;

          const candidatePaths = [
            path.join(
              resolvedDir,
              "steps",
              String(stepNum).padStart(4, "0"),
              "screenshot.png",
            ),
            path.join(resolvedDir, "steps", String(stepNum), "screenshot.png"),
            path.join(
              resolvedDir,
              "steps",
              String(i).padStart(4, "0"),
              "screenshot.png",
            ),
            path.join(resolvedDir, "steps", `${stepNum}.png`),
          ];

          let screenshotBase64: string | undefined = undefined;
          let screenshotUrl: string | undefined = undefined;

          for (const candidate of candidatePaths) {
            try {
              const buf = await fs.readFile(candidate);
              screenshotBase64 = buf.toString("base64");
              screenshotUrl = `data:image/png;base64,${screenshotBase64}`;
              break;
            } catch {
              // try next candidate
            }
          }

          steps.push({
            step: stepNum,
            ...rawStep,
            screenshotUrl:
              screenshotUrl ??
              (typeof rawStep.screenshotUrl === "string"
                ? rawStep.screenshotUrl
                : undefined),
            screenshotBase64,
          } as CrawlTraceStep);
        }

        traceData = {
          crawlRequestId: crawlRequest.id,
          status:
            typeof parsed.status === "string"
              ? parsed.status
              : crawlRequest.status,
          error:
            typeof parsed.error === "string"
              ? parsed.error
              : crawlRequest.error,
          targetInput: crawlRequest.targetInput,
          description: crawlRequest.description,
          traceDir: crawlRequest.traceDir,
          steps,
          findings: Array.isArray(parsed.findings) ? parsed.findings : [],
          apps: Array.isArray(parsed.apps) ? parsed.apps : [],
          ...parsed,
          crawlRequest: {
            id: crawlRequest.id,
            status: crawlRequest.status,
            targetType: crawlRequest.targetType,
            targetInput: crawlRequest.targetInput,
            description: crawlRequest.description,
            error: crawlRequest.error,
            traceDir: crawlRequest.traceDir,
            createdAt: crawlRequest.createdAt,
            updatedAt: crawlRequest.updatedAt,
          },
        };
      } catch (diskErr) {
        console.error(
          `Local trace fallback failed for crawl request ${crawlRequestId}:`,
          diskErr,
        );
      }
    }

    if (!traceData) {
      return {
        ok: false,
        message: "Trace data not found for crawl request.",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Crawl trace retrieved successfully.",
      data: traceData,
    };
  } catch (error) {
    console.error("Error retrieving crawl trace:", error);
    return {
      ok: false,
      message: "Failed to retrieve crawl trace.",
      data: null,
    };
  }
}
