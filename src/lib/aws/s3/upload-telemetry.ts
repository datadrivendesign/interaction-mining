"use client";

import type { UploadStage } from "./upload-policy";

/**
 * Upload telemetry via Google Analytics custom events.
 *
 * Lifecycle events rather than one terminal event: an upload abandoned by a
 * refresh or a tab close emits nothing at the end, so without a `started`
 * event it would vanish from the denominator instead of counting as a failure.
 *
 * GA4 does not report custom parameters until they are registered under
 * Admin → Custom definitions, and registration takes 24–48 h to backfill. The
 * dimensions and metrics below must be registered before the numbers mean
 * anything:
 *
 *   dimensions: purpose, outcome, stage, accelerated, page_hidden,
 *               attempt_bucket, effective_type
 *   metrics:    duration_ms, bytes, attempt
 *
 * No per-upload identifier is sent. That would be unbounded cardinality, which
 * GA samples or drops; aggregate counts are enough for the gate.
 *
 * GA is best-effort and undercounts unevenly — ad blockers, consent tooling,
 * offline clients, navigation away. Use it for relative health and the S3
 * access logs for authoritative volume and timing.
 */

/**
 * Only two events. An earlier draft also emitted one per attempt, but the
 * `attempt` metric and `attempt_bucket` dimension on `upload_finished` already
 * carry the retry distribution, so a third event would add cardinality without
 * answering anything new. Retry rate is read off `attempt`, not a ratio of
 * event counts.
 */
type UploadEventName = "upload_started" | "upload_finished";

type UploadEventParams = {
  purpose: string;
  bytes: number;
  durationMs?: number;
  outcome?: string;
  stage?: UploadStage;
  attempts?: number;
  pageHidden?: boolean;
};

/** Low-cardinality bucket, so attempt counts can segment a report. */
function attemptBucket(attempts?: number): string | undefined {
  if (attempts === undefined) return undefined;
  if (attempts <= 1) return "1";
  if (attempts === 2) return "2";
  return "3+";
}

/**
 * Connection class, when the browser exposes it. Absence must never alter
 * upload behaviour or block delivery of the event.
 */
function effectiveType(): string | undefined {
  try {
    const connection = (
      navigator as Navigator & { connection?: { effectiveType?: string } }
    ).connection;
    return connection?.effectiveType;
  } catch {
    return undefined;
  }
}

/**
 * Fire-and-forget. Wrapped so a throw can never escape into the upload path:
 * telemetry must not be able to fail or delay an upload.
 */
export function reportUploadEvent(
  name: UploadEventName,
  params: UploadEventParams,
): void {
  try {
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void })
      .gtag;
    if (typeof gtag !== "function") return;

    gtag("event", name, {
      purpose: params.purpose,
      bytes: params.bytes,
      ...(params.durationMs !== undefined && {
        duration_ms: params.durationMs,
      }),
      ...(params.outcome !== undefined && { outcome: params.outcome }),
      ...(params.stage !== undefined && { stage: params.stage }),
      ...(params.attempts !== undefined && {
        attempt: params.attempts,
        attempt_bucket: attemptBucket(params.attempts),
      }),
      ...(params.pageHidden !== undefined && {
        page_hidden: params.pageHidden,
      }),
      ...(effectiveType() !== undefined && { effective_type: effectiveType() }),
    });
  } catch {
    // Never surface a telemetry failure to the caller.
  }
}
