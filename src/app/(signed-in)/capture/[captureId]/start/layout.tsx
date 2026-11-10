import { Capture, getCapture } from "@/lib/actions";
import { CaptureStatus } from "@prisma/client";
import { Metadata } from "next";
import { CaptureGateError } from "../components/status-gate";

export const metadata: Metadata = {
  title: "Upload Capture",
};

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
  } else if (capture?.status === CaptureStatus.APPROVED && capture.appId) {
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
