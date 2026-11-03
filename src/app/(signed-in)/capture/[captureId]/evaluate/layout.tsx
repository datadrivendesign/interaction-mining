import { getCapture } from "@/lib/actions";
import { CaptureStatus } from "@prisma/client";
import { CaptureGateError } from "../components/status-gate";

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
        linkUrl={`/capture/${captureId}/start`}
      />
    );
  } else if (capture?.status === CaptureStatus.CREATED) {
    return (
      <CaptureGateError
        captureId={captureId}
        capture={capture}
        reason="NOT_INITIATED"
        linkUrl={`/capture/${captureId}/start`}
      />
    );
  } else if (capture?.status === CaptureStatus.PROCESSING) {
    return (
      <CaptureGateError
        captureId={captureId}
        capture={capture}
        reason="NOT_PROCESSED"
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
