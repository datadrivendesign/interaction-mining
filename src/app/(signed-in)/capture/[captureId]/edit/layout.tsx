import { notFound } from "next/navigation";
import { getCapture, getCaptureFiles } from "@/lib/actions";
import { CaptureStatus } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { isReviewer } from "@/lib/auth/roles";
import { CaptureGateError } from "../components/status-gate";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ captureId: string }>;
  children: React.ReactNode;
}) {
  const { captureId } = await params;
  const session = await auth();

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
      <CaptureGateError
        captureId={captureId}
        capture={capture}
        reason="NO_CAPTURE"
      />
    );
  } else if (capture?.status === CaptureStatus.CREATED) {
    return (
      <CaptureGateError
        captureId={captureId}
        capture={capture}
        reason="NOT_INITIATED"
      />
    );
  } else if (
    capture?.status === CaptureStatus.REVIEWING &&
    !isReviewer(session)
  ) {
    // The owner has handed the pen to the reviewer. Reviewers and admins may
    // still open the editor to fix the capture in place.
    return (
      <CaptureGateError
        captureId={captureId}
        capture={capture}
        reason="IN_REVIEW"
      />
    );
  } else if (capture?.status === CaptureStatus.REVIEWED) {
    // Nobody holds the pen while the final check is pending.
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

  // Check if the capture has any uploaded files
  const render = await getCaptureFiles(captureId).then((res) => {
    if (!res.ok) {
      notFound();
    }

    if (res.data.length === 0) {
      return (
        <>
          <CaptureGateError
            captureId={captureId}
            capture={capture}
            reason="NO_FILES"
          />
        </>
      );
    } else {
      return <>{children}</>;
    }
  });

  return render;
}
