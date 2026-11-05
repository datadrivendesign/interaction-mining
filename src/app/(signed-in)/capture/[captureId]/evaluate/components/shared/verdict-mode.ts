import { CaptureStatus } from "@prisma/client";

/**
 * Which verdict bar a viewer gets on the evaluate page. The server checks the
 * same rules again in each action; this only decides what to show.
 *
 * - `review`: a reviewer on a REVIEWING capture. Approve stages the screens
 *   and moves the capture to REVIEWED; Send back returns it to the worker.
 * - `direct`: an admin on a REVIEWING capture. Approve publishes in one step
 *   (the path that existed before the reviewer stage).
 * - `final`: an admin on a REVIEWED capture. Approve publishes the staged
 *   screens; Deny returns it to the worker and overturns the reviewer.
 * - `none`: the owner, or anyone on a capture not waiting for a verdict.
 */
export type VerdictMode = "review" | "direct" | "final" | "none";

export function getVerdictMode({
  isAdmin,
  isReviewer,
  status,
}: {
  isAdmin: boolean;
  isReviewer: boolean;
  status?: CaptureStatus | null;
}): VerdictMode {
  if (status === CaptureStatus.REVIEWING) {
    if (isAdmin) return "direct";
    if (isReviewer) return "review";
  }
  if (status === CaptureStatus.REVIEWED && isAdmin) {
    return "final";
  }
  return "none";
}

/** The queue Skip and "next capture" walk for a mode. */
export function queueStatusFor(mode: VerdictMode): CaptureStatus {
  return mode === "final" ? CaptureStatus.REVIEWED : CaptureStatus.REVIEWING;
}
