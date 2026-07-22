// app/api/crawl-requests/[crawlRequestId]/complete/route.ts
//
// Placeholder endpoint for dcc to call once a crawl finishes. dcc's real
// identity/auth scheme isn't decided yet, so this route is unauthenticated —
// harden this before it's load-bearing.
import { NextRequest, NextResponse } from "next/server";
import { CaptureStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ crawlRequestId: string }> },
) {
  try {
    const { crawlRequestId } = await params;

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
          status: "COMPLETED",
          error: "URL-target ingestion not yet implemented.",
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
      data: { status: "COMPLETED", captureId: capture.id },
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
