// app/api/crawl-requests/[crawlRequestId]/complete/route.ts
//
// Called by dcc-worker once a crawl finishes. Authenticated with a shared
// bearer token (DCC_AUTH_TOKEN, set on both this app and dcc-worker).
import { NextRequest, NextResponse } from "next/server";
import { CaptureStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const CompleteCrawlRequestInputSchema = z.object({
  status: z.enum(["success", "infeasible", "needs_help", "budget_exhausted", "error"]),
  error: z.string().optional(),
  traceDir: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ crawlRequestId: string }> },
) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.DCC_AUTH_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { crawlRequestId } = await params;

    const body = await request.json();
    const parsed = CompleteCrawlRequestInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid completion payload" },
        { status: 400 },
      );
    }
    const { status: dccStatus, error: dccError, traceDir } = parsed.data;

    const crawlRequest = await prisma.crawlRequest.findUnique({
      where: { id: crawlRequestId },
    });
    if (!crawlRequest) {
      return NextResponse.json(
        { error: "Crawl request not found" },
        { status: 404 },
      );
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
