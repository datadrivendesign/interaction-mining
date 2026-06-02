import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Capture, getCapture } from "@/lib/actions";
import { Platform } from "@/lib/utils";
import { CaptureStatus } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ captureId: string }>;
}): Promise<Metadata> {
  const { captureId } = await params;

  const { data: capture } = await getCapture({
    id: captureId,
    includes: { app: true, task: true },
  }).then((capture) => {
    if (!capture.ok) {
      notFound();
    } else {
      return capture;
    }
  });

  if (
    (capture.task.os as Platform) === Platform.IOS &&
    capture.app?.metadata.url
  ) {
    const appStoreId = capture.app.metadata.url.match(/\/id(\d+)/)?.[1];
    if (appStoreId) {
      return {
        title: "Upload Capture",
        other: {
          "apple-itunes-app": `app-id=${appStoreId}`,
        },
      };
    }
  }

  const metadata: Metadata = {
    title: "Upload Capture",
  };

  return metadata;
}

enum ErrorType {
  NO_CAPTURE = "NO_CAPTURE",
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
}

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ captureId: string }>;
  children: React.ReactNode;
}) {
  const { captureId } = await params;
  const captureRes = await getCapture({ id: captureId });
  const capture = captureRes.data;

  if (!captureRes?.ok || !capture) {
    return (
      <Error
        captureId={captureId}
        capture={capture}
        errorType={ErrorType.NO_CAPTURE}
      />
    );
  } else if (capture?.status === CaptureStatus.REVIEWING) {
    return (
      <Error
        captureId={captureId}
        capture={capture}
        errorType={ErrorType.IN_REVIEW}
      />
    );
  } else if (capture?.status === CaptureStatus.APPROVED && capture?.appId) {
    return (
      <Error
        captureId={captureId}
        capture={capture}
        errorType={ErrorType.APPROVED}
      />
    );
  }
  return <>{children}</>;
}

function Error({
  captureId,
  capture,
  errorType,
}: {
  captureId: string;
  capture: Capture | null;
  errorType: ErrorType;
}) {
  const getError = (type: ErrorType) => {
    switch (type) {
      case ErrorType.NO_CAPTURE:
        return {
          title: "Capture not found",
          message: `Failed to fetch capture. Please try again later.`,
          linkText: "Return to upload",
          linkUrl: `/capture/${captureId}/upload`,
        };
      case ErrorType.IN_REVIEW:
        return {
          title: "Capture in review",
          message:
            "This capture is currently in review. If this status looks wrong (for example, it was recently sent back), refresh this page and try again.",
          linkText: "Return to review",
          linkUrl: `/capture/${captureId}/evaluate`,
        };
      case ErrorType.APPROVED:
        return {
          title: "Capture already approved",
          message:
            "This capture has already been approved. You can view the completed trace.",
          linkText: "View trace",
          linkUrl: `/app/${capture!.appId}/trace/${capture!.traceId}`,
        };
    }
  };
  const error = getError(errorType);

  return (
    <div className="flex w-dvw min-h-[calc(100dvh-64px)] justify-center items-start md:items-center p-8 md:p-16">
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>{error.title}</CardTitle>
          <CardDescription>{error.message}</CardDescription>
          <Link href={error.linkUrl}>
            <span className="inline-flex items-center underline">
              <ArrowLeft className="w-4 h-4 mr-1 inline-block" />
              {error.linkText}
            </span>
          </Link>
        </CardHeader>
      </Card>
    </div>
  );
}
