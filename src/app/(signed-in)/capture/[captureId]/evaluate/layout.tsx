import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Capture, getCapture } from "@/lib/actions";
import { CaptureStatus } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

enum ErrorType {
  NO_CAPTURE = "NO_CAPTURE",
  NOT_INITIATED = "NOT_INITIATED",
  NOT_PROCESSED = "NOT_PROCESSED",
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
  } else if (capture?.status === CaptureStatus.CREATED) {
    return (
      <Error
        captureId={captureId}
        capture={capture}
        errorType={ErrorType.NOT_INITIATED}
      />
    );
  } else if (capture?.status === CaptureStatus.PROCESSING) {
    return (
      <Error
        captureId={captureId}
        capture={capture}
        errorType={ErrorType.NOT_PROCESSED}
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
          linkUrl: `/capture/${captureId}/start`,
        };
      case ErrorType.NOT_INITIATED:
        return {
          title: "Intiate the capture",
          message:
            "The capture you are looking for has not been initiated yet or uploaded files. Please upload files and intialize the capture.",
          linkText: "Return to upload",
          linkUrl: `/capture/${captureId}/start`,
        };
      case ErrorType.NOT_PROCESSED:
        return {
          title: "Capture not processed",
          message:
            "The capture has not been processed yet. Please finish processing the capture before evaluating.",
          linkText: "Return to processing",
          linkUrl: `/capture/${captureId}/edit`,
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
    <div className="flex min-h-[calc(100dvh-64px)] w-dvw items-start justify-center p-8 md:items-center md:p-16">
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>{error.title}</CardTitle>
          <CardDescription>{error.message}</CardDescription>
          <Link href={error.linkUrl}>
            <span className="inline-flex items-center underline">
              <ArrowLeft className="mr-1 inline-block h-4 w-4" />
              {error.linkText}
            </span>
          </Link>
        </CardHeader>
      </Card>
    </div>
  );
}
