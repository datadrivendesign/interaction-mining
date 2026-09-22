"use client";

import {
  UPLOAD_POLICY,
  backoffDelayMs,
  classifyPutFailure,
  classifySigningFailure,
  describeExhaustion,
  hasBudgetRemaining,
  type UploadStage,
} from "./upload-policy";

/** How an upload ended when it did not succeed. */
export type TerminalKind = "transient-exhausted" | "permanent" | "cancelled";

/** Progress and lifecycle, surfaced to the UI. */
export type UploadState =
  | { phase: "idle" }
  | { phase: "signing"; attempt: number }
  | { phase: "uploading"; attempt: number; loaded: number; total: number }
  | { phase: "retrying"; attempt: number; delayMs: number; reason: string }
  | { phase: "succeeded" }
  | {
      phase: "failed";
      kind: TerminalKind;
      stage: UploadStage;
      message: string;
    };

/** What the caller must supply to obtain a URL for each attempt. */
export type SignResult =
  | { ok: true; url: string; contentType: string }
  | { ok: false; status?: number; message: string };

export type PutWithRetryResult =
  | { ok: true; attempts: number; bytesSent: number; pageWasHidden: boolean }
  | {
      ok: false;
      kind: TerminalKind;
      stage: UploadStage;
      status?: number;
      message: string;
      pageWasHidden: boolean;
    };

type AbortReason = "inactivity" | "cancelled";

/**
 * Result of one PUT. `status` 0 means no response reached script at all.
 */
type SinglePutOutcome = {
  status: number;
  bytesSent: number;
  abortedBy?: AbortReason;
};

/**
 * Issues one PUT with progress reporting and a sliding inactivity watchdog.
 *
 * Uses `XMLHttpRequest` rather than `fetch` because only XHR reports upload
 * progress, which is both the UI signal and the watchdog's input.
 */
function singlePut(
  url: string,
  file: File,
  contentType: string,
  options: {
    signal?: AbortSignal;
    onProgress: (loaded: number, total: number) => void;
    generation: number;
    isCurrent: (generation: number) => boolean;
  },
): Promise<SinglePutOutcome> {
  const { signal, onProgress, generation, isCurrent } = options;

  return new Promise<SinglePutOutcome>((resolve) => {
    const xhr = new XMLHttpRequest();
    let bytesSent = 0;
    let settled = false;
    let abortedBy: AbortReason | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (watchdog !== undefined) clearTimeout(watchdog);
      watchdog = undefined;
      signal?.removeEventListener("abort", onExternalAbort);
    };

    const settle = (outcome: SinglePutOutcome) => {
      // Deliberately does NOT check `isCurrent`: attempts are awaited in
      // sequence, so this promise must always resolve or the loop would hang.
      // Staleness only matters for progress events, which are guarded below.
      if (settled) return;
      settled = true;
      cleanup();
      resolve(outcome);
    };

    // Sliding window: every byte of progress buys another full interval.
    const armWatchdog = () => {
      if (watchdog !== undefined) clearTimeout(watchdog);
      watchdog = setTimeout(() => {
        abortedBy = "inactivity";
        xhr.abort();
      }, UPLOAD_POLICY.inactivityMs);
    };

    function onExternalAbort() {
      abortedBy = "cancelled";
      xhr.abort();
    }

    xhr.upload.onprogress = (event) => {
      if (!isCurrent(generation)) return;
      bytesSent = event.loaded;
      armWatchdog();
      onProgress(event.loaded, event.total || file.size);
    };

    xhr.onload = () => settle({ status: xhr.status, bytesSent });
    // `onerror` fires for network failures and CORS rejections alike; the
    // browser exposes no way to tell them apart, hence status 0.
    xhr.onerror = () => settle({ status: 0, bytesSent });
    xhr.onabort = () => settle({ status: 0, bytesSent, abortedBy });

    xhr.open("PUT", url, true);
    // Must match the type bound into the signature, or S3 returns 403.
    xhr.setRequestHeader("Content-Type", contentType);
    signal?.addEventListener("abort", onExternalAbort);
    armWatchdog();
    xhr.send(file);
  });
}

/**
 * Uploads a file to S3, signing a fresh URL per attempt and retrying only what
 * is worth retrying.
 *
 * Invariants:
 * - At most one XHR is in flight; attempts are awaited in sequence.
 * - Signing and PUT draw on separate budgets, so a signing outage cannot
 *   silently exhaust the PUT retries.
 * - Every attempt reuses the same object key and the same bytes, so a PUT that
 *   succeeded but whose response was lost is idempotent rather than duplicated.
 *
 * `pageWasHidden` is recorded for telemetry only. Whether a hidden page
 * actually causes upload failures here is an open question — the median upload
 * finishes well inside any auto-lock interval — so this measures the hypothesis
 * rather than acting on it.
 */
export async function putWithRetry(options: {
  file: File;
  getFreshUrl: () => Promise<SignResult>;
  signal?: AbortSignal;
  onState?: (state: UploadState) => void;
}): Promise<PutWithRetryResult> {
  const { file, getFreshUrl, signal, onState } = options;

  let generation = 0;
  const isCurrent = (g: number) => g === generation;
  const emit = (state: UploadState) => onState?.(state);

  let pageWasHidden =
    typeof document !== "undefined" && document.visibilityState === "hidden";
  const onVisibility = () => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      pageWasHidden = true;
    }
  };
  const onPageHide = () => {
    pageWasHidden = true;
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
  }

  const teardown = () => {
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    }
  };

  const fail = (
    kind: TerminalKind,
    stage: UploadStage,
    message: string,
    status?: number,
  ): PutWithRetryResult => {
    teardown();
    emit({ phase: "failed", kind, stage, message });
    return { ok: false, kind, stage, status, message, pageWasHidden };
  };

  /** Waits out a backoff, resolving false if cancelled mid-wait. */
  const waitFor = (delayMs: number) =>
    new Promise<boolean>((resolve) => {
      if (signal?.aborted) return resolve(false);
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve(true);
      }, delayMs);
      function onAbort() {
        clearTimeout(timer);
        resolve(false);
      }
      signal?.addEventListener("abort", onAbort, { once: true });
    });

  let signingAttempts = 0;
  let putAttempts = 0;
  let bytesEverSent = 0;

  while (true) {
    if (signal?.aborted) return fail("cancelled", "put", "Upload cancelled.");

    // ---- sign ----
    signingAttempts += 1;
    generation += 1;
    emit({ phase: "signing", attempt: putAttempts + 1 });
    const signed = await getFreshUrl();

    if (!signed.ok) {
      if (
        classifySigningFailure(signed.status) === "permanent" ||
        !hasBudgetRemaining("signing", signingAttempts)
      ) {
        return fail(
          classifySigningFailure(signed.status) === "permanent"
            ? "permanent"
            : "transient-exhausted",
          "signing",
          signed.message,
          signed.status,
        );
      }
      const delayMs = backoffDelayMs(signingAttempts);
      emit({
        phase: "retrying",
        attempt: putAttempts + 1,
        delayMs,
        reason: "Getting ready to upload\u2026",
      });
      if (!(await waitFor(delayMs)))
        return fail("cancelled", "signing", "Upload cancelled.");
      continue;
    }

    // ---- put ----
    putAttempts += 1;
    const outcome = await singlePut(signed.url, file, signed.contentType, {
      signal,
      generation,
      isCurrent,
      onProgress: (loaded, total) =>
        emit({ phase: "uploading", attempt: putAttempts, loaded, total }),
    });
    bytesEverSent = Math.max(bytesEverSent, outcome.bytesSent);

    if (outcome.status >= 200 && outcome.status < 300) {
      teardown();
      emit({ phase: "succeeded" });
      return {
        ok: true,
        attempts: putAttempts,
        bytesSent: outcome.bytesSent,
        pageWasHidden,
      };
    }

    if (outcome.abortedBy === "cancelled") {
      return fail("cancelled", "put", "Upload cancelled.");
    }

    const disposition =
      outcome.abortedBy === "inactivity"
        ? "retry"
        : classifyPutFailure(outcome.status);

    if (disposition === "permanent") {
      return fail(
        "permanent",
        "put",
        "Something went wrong and we couldn't upload this recording. Please try again.",
        outcome.status,
      );
    }

    if (!hasBudgetRemaining("put", putAttempts)) {
      return fail(
        "transient-exhausted",
        "put",
        describeExhaustion(bytesEverSent),
        outcome.status,
      );
    }

    const delayMs = backoffDelayMs(putAttempts);
    emit({
      phase: "retrying",
      attempt: putAttempts,
      delayMs,
      reason:
        outcome.abortedBy === "inactivity"
          ? "The upload stalled."
          : "Lost connection.",
    });
    if (!(await waitFor(delayMs)))
      return fail("cancelled", "put", "Upload cancelled.");
  }
}
