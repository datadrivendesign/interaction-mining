/**
 * Retry and timeout policy for browser uploads.
 *
 * Deliberately pure and DOM-free so it can be unit tested without a browser.
 * The XHR machinery that consumes it lives in `./put-with-retry`.
 */

/** Which stage of an upload attempt produced a result. */
export type UploadStage = "signing" | "put" | "post-put";

/** How the caller should react to a failure. */
export type FailureDisposition = "retry" | "permanent";

export const UPLOAD_POLICY = {
  /** PUT attempts, including the first. */
  maxPutAttempts: 4,
  /**
   * Signing attempts, tracked separately so a signing outage cannot silently
   * consume the PUT budget.
   */
  maxSigningAttempts: 3,
  /**
   * Sliding inactivity window. Reset every time uploaded bytes advance, so a
   * slow-but-healthy transfer is never aborted — unlike `xhr.timeout`, which is
   * a deadline on the whole request.
   */
  inactivityMs: 60_000,
  backoff: {
    baseMs: 2_000,
    factor: 2,
    capMs: 30_000,
  },
} as const;

/**
 * Bounded exponential backoff with full jitter.
 *
 * Full jitter (random over the whole interval, not a fraction of it) keeps a
 * cohort of clients that failed together from retrying in lockstep.
 *
 * @param attempt 1-based index of the attempt that just failed.
 * @param random Injectable for tests; defaults to `Math.random`.
 */
export function backoffDelayMs(
  attempt: number,
  random: () => number = Math.random,
): number {
  const { baseMs, factor, capMs } = UPLOAD_POLICY.backoff;
  const ceiling = Math.min(capMs, baseMs * Math.pow(factor, attempt - 1));
  return Math.round(random() * ceiling);
}

/**
 * Classifies the outcome of a PUT to S3.
 *
 * `status` of 0 means the browser gave us no response at all — a network drop,
 * or a CORS rejection, which are indistinguishable from script. Both are
 * treated as transient but bounded; see `describeExhaustion` for how to phrase
 * the terminal message when nothing ever reached the wire.
 */
export function classifyPutFailure(status: number): FailureDisposition {
  if (status === 0) return "retry";
  if (status === 408 || status === 429) return "retry";
  if (status >= 500) return "retry";
  // Every other 4xx is a request the server will keep rejecting: bad
  // signature, expired URL, size or type mismatch, missing permission.
  return "permanent";
}

/** Classifies a failure of the presigning server action. */
export function classifySigningFailure(status?: number): FailureDisposition {
  // No status means the action call itself never completed — treat as network.
  if (status === undefined || status === 0) return "retry";
  if (status === 408 || status === 429) return "retry";
  if (status >= 500) return "retry";
  return "permanent";
}

/**
 * Chooses the terminal message after the retry budget is spent.
 *
 * The split still carries the diagnostic signal — when no bytes ever left the
 * device across every attempt, the cause is almost certainly ours (a CORS rule,
 * a bad endpoint) rather than the worker's connection — but the wording stays
 * out of that vocabulary. The reader is a worker on a phone, mid-task, who
 * needs to know whether to retry and whether their recording is safe. The
 * technical distinction is preserved in telemetry via `outcome`, `stage` and
 * the byte count, which is where triage should read it from.
 */
export function describeExhaustion(bytesEverSent: number): string {
  return bytesEverSent === 0
    ? "We couldn't start the upload. This is most likely a problem on our end, not yours. Please try again."
    : "The upload kept stopping before it finished. Check your internet connection and try again.";
}

/** Whether another attempt is permitted for a given stage. */
export function hasBudgetRemaining(
  stage: Exclude<UploadStage, "post-put">,
  attemptsUsed: number,
): boolean {
  const limit =
    stage === "signing"
      ? UPLOAD_POLICY.maxSigningAttempts
      : UPLOAD_POLICY.maxPutAttempts;
  return attemptsUsed < limit;
}
