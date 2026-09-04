// app/api/crawl-requests/[crawlRequestId]/complete/route.ts
//
// Called by dcc-worker once a crawl finishes. Authenticated with a shared
// bearer token (DCC_AUTH_TOKEN, set on both this app and dcc-worker).
import { NextRequest, NextResponse } from "next/server";
import { CaptureStatus } from "@prisma/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/aws";

const ObjectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i);

const CrawlStepInputSchema = z
  .object({
    step: z.number(),
    screenshotBase64: z.string().optional(),
    screenshotUrl: z.string().optional(),
    screenshotKey: z.string().optional(),
  })
  .passthrough();

const CrawlResultInputSchema = z
  .object({
    status: z.string(),
    error: z.string().optional(),
    findings: z.array(z.unknown()).optional(),
    steps: z.array(CrawlStepInputSchema).optional(),
  })
  .passthrough();

const CompleteCrawlRequestInputSchema = z.object({
  status: z.enum(["success", "infeasible", "needs_help", "budget_exhausted", "error"]),
  error: z.string().optional(),
  traceDir: z.string().min(1),
  result: CrawlResultInputSchema.optional(),
});

function getCrawlFileUrl(fileKey: string): string {
  if (process.env.USE_MINIO_STORE === "true") {
    return `${process.env.MINIO_ENDPOINT}/${process.env._AWS_UPLOAD_BUCKET}/${fileKey}`;
  }
  if (process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL) {
    return `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${fileKey}`;
  }
  if (process.env._AWS_UPLOAD_BUCKET) {
    const region = process.env._AWS_REGION || "us-east-1";
    return `https://${process.env._AWS_UPLOAD_BUCKET}.s3.${region}.amazonaws.com/${fileKey}`;
  }
  return `/${fileKey}`;
}

async function uploadCrawlTraceToS3(
  crawlRequestId: string,
  result: z.infer<typeof CrawlResultInputSchema>,
) {
  const bucket = process.env._AWS_UPLOAD_BUCKET;
  if (!bucket) {
    console.warn("Cannot upload crawl trace to S3: _AWS_UPLOAD_BUCKET is not set.");
    return;
  }

  const rawSteps = result.steps ?? [];
  const sanitizedSteps: Array<Record<string, unknown>> = [];

  for (const step of rawSteps) {
    const stepKey = `traces/crawls/${crawlRequestId}/steps/${step.step}.png`;
    let screenshotUrl = step.screenshotUrl;

    if (step.screenshotBase64) {
      try {
        const base64Data = step.screenshotBase64.includes(",")
          ? step.screenshotBase64.split(",")[1]
          : step.screenshotBase64;
        const buffer = Buffer.from(base64Data, "base64");

        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: stepKey,
            Body: buffer,
            ContentType: "image/png",
          }),
        );
        screenshotUrl = getCrawlFileUrl(stepKey);
      } catch (uploadErr) {
        console.error(`Failed to upload screenshot for step ${step.step}:`, uploadErr);
      }
    }

    const { screenshotBase64: _removed, ...stepRest } = step;
    sanitizedSteps.push({
      ...stepRest,
      ...(screenshotUrl ? { screenshotUrl } : {}),
      screenshotKey: stepKey,
    });
  }

  const sanitizedResult = {
    ...result,
    steps: sanitizedSteps,
  };

  try {
    const resultKey = `traces/crawls/${crawlRequestId}/result.json`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: resultKey,
        Body: JSON.stringify(sanitizedResult, null, 2),
        ContentType: "application/json",
      }),
    );
  } catch (resultUploadErr) {
    console.error("Failed to upload sanitized result.json to S3:", resultUploadErr);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ crawlRequestId: string }> },
) {
  const authHeader = request.headers.get("authorization");
  const authToken = process.env.DCC_AUTH_TOKEN;
  if (!authToken || authHeader !== `Bearer ${authToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { crawlRequestId } = await params;
    if (!ObjectIdSchema.safeParse(crawlRequestId).success) {
      return NextResponse.json(
        { error: "Invalid crawl request ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = CompleteCrawlRequestInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid completion payload", details: parsed.error.format() },
        { status: 400 },
      );
    }
    const { status: dccStatus, error: dccError, traceDir, result } = parsed.data;

    const crawlRequest = await prisma.crawlRequest.findUnique({
      where: { id: crawlRequestId },
    });
    if (!crawlRequest) {
      return NextResponse.json(
        { error: "Crawl request not found" },
        { status: 404 },
      );
    }

    if (result) {
      await uploadCrawlTraceToS3(crawlRequestId, result);
    }

    if (crawlRequest.targetType !== "PLAY_STORE_APP" || !crawlRequest.appId) {
      // TODO: URL-target ingestion isn't wired up yet — App has no concept of
      // a generic website app today. Record completion without creating a
      // Capture rather than fabricating an App row.
      await prisma.crawlRequest.update({
        where: { id: crawlRequestId },
        data: {
          status: dccStatus === "success" ? "COMPLETED" : "FAILED",
          error:
            dccStatus === "success"
              ? null
              : (dccError ?? `dcc run ended with status: ${dccStatus}`),
          traceDir,
        },
      });
      return NextResponse.json({ message: "Recorded (no ingestion)" });
    }

    if (dccStatus !== "success") {
      await prisma.crawlRequest.update({
        where: { id: crawlRequestId },
        data: {
          status: "FAILED",
          error: dccError ?? `dcc run ended with status: ${dccStatus}`,
          traceDir,
        },
      });
      return NextResponse.json({ message: "Recorded (crawl failed)" });
    }

    const task = await prisma.task.create({
      data: {
        appId: crawlRequest.appId,
        os: "android",
        description: crawlRequest.description,
      },
    });

    const capture = await prisma.capture.create({
      data: {
        app: { connect: { id: crawlRequest.appId } },
        task: { connect: { id: task.id } },
        user: { connect: { id: crawlRequest.userId } },
        otp: "",
        src: "",
        status: CaptureStatus.CREATED,
      },
    });

    await prisma.crawlRequest.update({
      where: { id: crawlRequestId },
      data: { status: "COMPLETED", captureId: capture.id, traceDir },
    });

    return NextResponse.json({ message: "Capture created", captureId: capture.id });
  } catch (error) {
    console.error("Crawl request completion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
