import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Capture, getCapture, getCaptureFiles } from "@/lib/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CaptureStatus } from "@prisma/client";

enum ErrorType {
  NO_CAPTURE = "NO_CAPTURE",
  NOT_INITIATED = "NOT_INITIATED",
  IN_REVIEW = "IN_REVIEW",
  NO_FILES = "NO_FILES",
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

  // Add retry logic to handle cache staleness
  let captureRes = await getCapture({ id: captureId });
  let capture = captureRes.data;

  // If capture is not found, try once more after a short delay
  if (!captureRes?.ok || !capture) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    captureRes = await getCapture({ id: captureId });
    capture = captureRes.data;
  }

  if (!captureRes?.ok || !capture) {
    return (
      <Error
        captureId={captureId}
        capture={capture}
        errorType={ErrorType.NO_CAPTURE}
      />
    );
  } else if (capture?.status === CaptureStatus.CREATED) {
    return (
      <Error
        captureId={captureId}
        capture={capture}
        errorType={ErrorType.NOT_INITIATED}
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
  } else if (capture?.status === CaptureStatus.APPROVED && capture.appId) {
    return (
      <Error
        captureId={captureId}
        capture={capture}
        errorType={ErrorType.APPROVED}
      />
    );
  }

  // Check if the capture has any uploaded files
  const render = await getCaptureFiles(captureId).then((res) => {
    if (!res.ok) {
      notFound();
    }

    if (res.data.length === 0) {
      return (
        <>
          <Error
            captureId={captureId}
            capture={capture}
            errorType={ErrorType.NO_FILES}
          />
        </>
      );
    } else {
      return <>{children}</>;
    }
  });

  return render;
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
      case ErrorType.NO_FILES:
        return {
          title: "Waiting for files...",
          message:
            "The capture you are looking for does not have any uploaded files. Please upload files to proceed.",
          linkText: "Return to upload",
          linkUrl: `/capture/${captureId}/upload`,
        };
      case ErrorType.NOT_INITIATED:
        return {
          title: "Intiate the capture",
          message:
            "The capture you are looking for has not been initiated yet or uploaded files. Please upload files and intialize the capture.",
          linkText: "Return to upload",
          linkUrl: `/capture/${captureId}/upload`,
        };
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
