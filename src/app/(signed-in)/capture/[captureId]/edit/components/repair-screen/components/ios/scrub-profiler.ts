/**
 * Temporary instrumentation for deciding whether the thumbnail preview pipeline
 * can be replaced by native video seeking.
 *
 * Measures the two numbers that decide it:
 *
 *  - how long a seek takes to actually put a frame on screen, and how often that
 *    never happens (the reason native scrubbing felt broken before), and
 *  - how much of bootstrap is spent extracting preview thumbnails, which is what
 *    going native would buy back.
 *
 * Off unless switched on, so it costs a boolean check per seek otherwise. Enable
 * with `?scrubProfiling=1` on the URL, or persistently:
 *
 *     localStorage.setItem("odim:scrub-profiling", "1")
 *
 * Then scrub around and call `__odimScrubProfile.summary()` in the console.
 *
 * Delete this file once the question is settled.
 */

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: { mediaTime: number }) => void,
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

interface SeekSample {
  /** Where the seek asked to land. */
  requestedTime: number;
  /** Where the presented frame actually was, when the browser reports it. */
  presentedTime: number | null;
  /** Issue to presentation, in milliseconds. */
  latencyMs: number;
  /** Never presented within the stall threshold. */
  stalled: boolean;
  /**
   * Element state captured at stall time, to tell two very different things
   * apart: an element genuinely stuck mid-seek, which is the failure that makes
   * native scrubbing unusable, versus a seek that completed while
   * `requestVideoFrameCallback` simply never fired — a reporting gap with no
   * effect on what the worker sees.
   */
  stallState?: {
    currentTime: number;
    seeking: boolean;
    readyState: number;
    /** The element sits at the requested moment despite no frame callback. */
    reachedTarget: boolean;
  };
}

/** A seek not presented within this long counts as a stall, not slow. */
const STALL_THRESHOLD_MS = 1000;

const samples: SeekSample[] = [];
const phaseTimings: Record<string, number[]> = {};
let supersededCount = 0;
let isEnabledCache: boolean | null = null;
let isInstalled = false;

let inFlight: {
  video: HTMLVideoElement;
  requestedTime: number;
  startedAt: number;
  frameHandle: number | null;
  stallTimeout: number | null;
} | null = null;

export function isScrubProfilingEnabled(): boolean {
  if (isEnabledCache !== null) {
    return isEnabledCache;
  }
  if (typeof window === "undefined") {
    return false;
  }
  let enabled = false;
  try {
    enabled = window.localStorage.getItem("odim:scrub-profiling") === "1";
  } catch {
    // Storage can be unavailable; the query parameter still works.
  }
  if (!enabled) {
    enabled = new URLSearchParams(window.location.search).has("scrubProfiling");
  }
  isEnabledCache = enabled;
  return enabled;
}

function percentile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * fraction) - 1),
  );
  return sorted[index];
}

function round(value: number, places = 1): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function summary() {
  const presented = samples.filter((sample) => !sample.stalled);
  const latencies = presented
    .map((sample) => sample.latencyMs)
    .sort((a, b) => a - b);
  const errors = presented
    .filter((sample) => sample.presentedTime !== null)
    .map((sample) =>
      Math.abs((sample.presentedTime as number) - sample.requestedTime),
    )
    .sort((a, b) => a - b);

  const stalls = samples.filter((sample) => sample.stalled);
  // A stall where the element reached the target and is no longer seeking means
  // the frame was there and only the callback went missing.
  const unreportedFrames = stalls.filter(
    (sample) => sample.stallState?.reachedTarget && !sample.stallState.seeking,
  ).length;

  const result = {
    seeks: samples.length,
    presented: presented.length,
    stalls: stalls.length,
    /** Stalls that were really the element stuck mid-seek. */
    stalledStuck: stalls.length - unreportedFrames,
    /** Stalls that were only a missing frame callback. */
    stalledButFramePresent: unreportedFrames,
    /** Seeks abandoned because the pointer moved on before they landed. */
    superseded: supersededCount,
    latencyMsP50: round(percentile(latencies, 0.5)),
    latencyMsP95: round(percentile(latencies, 0.95)),
    latencyMsMax: round(latencies[latencies.length - 1] ?? 0),
    /** How far the presented frame sat from the requested moment, in seconds. */
    frameErrorSecP50: round(percentile(errors, 0.5), 3),
    frameErrorSecMax: round(errors[errors.length - 1] ?? 0, 3),
  };

  const phases = Object.fromEntries(
    Object.entries(phaseTimings).map(([name, values]) => [
      name,
      {
        runs: values.length,
        totalMs: round(values.reduce((sum, value) => sum + value, 0)),
        lastMs: round(values[values.length - 1] ?? 0),
      },
    ]),
  );

  console.table(result);
  console.table(phases);
  return { ...result, phases };
}

function reset() {
  samples.length = 0;
  supersededCount = 0;
  Object.keys(phaseTimings).forEach((key) => delete phaseTimings[key]);
}

function install() {
  if (isInstalled || typeof window === "undefined") {
    return;
  }
  isInstalled = true;
  (
    window as unknown as { __odimScrubProfile: unknown }
  ).__odimScrubProfile = { summary, reset, samples, phaseTimings };
  console.info(
    "[scrub-profiler] recording. Call __odimScrubProfile.summary() when done.",
  );
}

function settleInFlight(presentedTime: number | null, stalled: boolean) {
  if (!inFlight) {
    return;
  }
  if (inFlight.stallTimeout !== null) {
    window.clearTimeout(inFlight.stallTimeout);
  }

  const { video, requestedTime } = inFlight;
  samples.push({
    requestedTime,
    presentedTime,
    latencyMs: performance.now() - inFlight.startedAt,
    stalled,
    stallState: stalled
      ? {
          currentTime: video.currentTime,
          seeking: video.seeking,
          readyState: video.readyState,
          reachedTarget: Math.abs(video.currentTime - requestedTime) <= 0.05,
        }
      : undefined,
  });
  inFlight = null;
}

/**
 * Call immediately after assigning `video.currentTime`.
 *
 * Timing ends when the browser reports a frame presented, which is the moment
 * the worker can actually see it — `seeked` fires earlier and would flatter the
 * numbers.
 */
export function recordSeekIssued(
  video: HTMLVideoElement,
  requestedTime: number,
): void {
  if (!isScrubProfilingEnabled()) {
    return;
  }
  install();

  const videoWithCallback = video as VideoWithFrameCallback;

  if (inFlight) {
    // The pointer moved on before this one landed. Not a stall — the opposite,
    // it says the decoder is behind the input.
    if (inFlight.frameHandle !== null) {
      videoWithCallback.cancelVideoFrameCallback?.(inFlight.frameHandle);
    }
    if (inFlight.stallTimeout !== null) {
      window.clearTimeout(inFlight.stallTimeout);
    }
    inFlight = null;
    supersededCount += 1;
  }

  const started = performance.now();
  inFlight = {
    video,
    requestedTime,
    startedAt: started,
    frameHandle: null,
    stallTimeout: window.setTimeout(
      () => settleInFlight(null, true),
      STALL_THRESHOLD_MS,
    ),
  };

  if (typeof videoWithCallback.requestVideoFrameCallback === "function") {
    inFlight.frameHandle = videoWithCallback.requestVideoFrameCallback(
      (_now, metadata) => settleInFlight(metadata.mediaTime, false),
    );
    return;
  }

  // No frame-presentation support: fall back to `seeked`, and note that these
  // latencies are optimistic by however long painting takes.
  const onSeeked = () => {
    video.removeEventListener("seeked", onSeeked);
    settleInFlight(video.currentTime, false);
  };
  video.addEventListener("seeked", onSeeked, { once: true });
}

/**
 * Record how long a named bootstrap phase took.
 *
 * `previewThumbnails` is the one that matters — it is the work that disappears
 * if the preview pipeline is removed.
 */
export function recordPhase(name: string, durationMs: number): void {
  if (!isScrubProfilingEnabled()) {
    return;
  }
  install();
  phaseTimings[name] = phaseTimings[name] ?? [];
  phaseTimings[name].push(durationMs);
}
