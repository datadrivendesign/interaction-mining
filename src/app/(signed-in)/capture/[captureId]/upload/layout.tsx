import { Capture, getCapture } from "@/lib/actions";
import { Platform } from "@/lib/utils";
import { CaptureStatus } from "@prisma/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaptureGateError } from "../components/status-gate";

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
      <CaptureGateError
        captureId={captureId}
        capture={capture}
        reason="NO_CAPTURE"
      />
    );
  } else if (capture?.status === CaptureStatus.REVIEWING) {
    return (
      <CaptureGateError
        captureId={captureId}
        capture={capture}
        reason="IN_REVIEW"
      />
    );
  } else if (capture?.status === CaptureStatus.REVIEWED) {
    return (
      <CaptureGateError
        captureId={captureId}
        capture={capture}
        reason="WAITING_FINAL"
      />
    );
  } else if (capture?.status === CaptureStatus.APPROVED && capture?.appId) {
    return (
      <CaptureGateError
        captureId={captureId}
        capture={capture}
        reason="APPROVED"
      />
    );
  }
  return <>{children}</>;
}
