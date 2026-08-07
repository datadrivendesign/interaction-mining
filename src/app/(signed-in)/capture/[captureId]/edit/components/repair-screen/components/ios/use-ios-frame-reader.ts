import { RefObject, useCallback, useRef } from "react";
import { FrameData } from "../../../types";
import { ExtractVideoFrameOptions, extractVideoFrame } from "../../util";
import { isScrubProfilingEnabled, logScrubEvent } from "./scrub-profiler";

/**
 * Wait until the browser has actually painted.
 *
 * A seek finishing does not mean the new frame is the one canvas will read.
 * `seeked` reports that the playback position moved; the decoded picture
 * reaches the surface `drawImage` samples a frame later, and reading in that
 * gap returns the previous frame with the new timestamp. Two frames rather than
 * one because the first callback runs before compositing, not after.
 */
const waitForPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

/**
 * Reads frames out of the recording the worker is looking at.
 *
 * An earlier version read from a detached element instead, on the theory that
 * Safari composites a visible video through a path canvas cannot read back.
 * That was measurement error — the fingerprint sampled the diagonal of a
 * letterboxed frame and reported the black bars, so it looked constant no
 * matter what was drawn. Measured properly, the detached element is the one
 * that returns a constant: it decodes during bootstrap's back-to-back
 * extraction, then goes idle, and WebKit releases the decoder for an element
 * that is not in the document. Its later seeks completed in a millisecond
 * against nothing and every read handed back the last frame it had decoded,
 * which is how a screen from elsewhere in the recording ended up on the panel
 * and in captures.
 *
 * The displayed element is on screen and never suspended, so it stays honest.
 * What it does need is time: reads wait for a paint before sampling.
 *
 * @param videoRef - The displayed recording.
 */
export function useIosFrameReader(videoRef: RefObject<HTMLVideoElement | null>) {
  /**
   * Tail of the read queue.
   *
   * Settled frames, captures and the bootstrap screen pass all read the same
   * element, and two overlapping seeks on one element resolve on each other's
   * `seeked` and leave it somewhere neither caller asked for.
   * `extractVideoThumbnails` learned this the hard way and runs its own loop
   * strictly sequentially ("parallel messes up seeking"); this applies the same
   * discipline to callers that cannot see each other.
   */
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  /** Run `operation` once every read queued before it has finished. */
  const enqueue = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const run = queueRef.current.then(operation, operation);
    // Swallowed only for the chain's benefit: a rejected read must not stop the
    // reads behind it. The caller still sees the rejection through `run`.
    queueRef.current = run.catch(() => undefined);
    return run;
  }, []);

  /**
   * Paint the frame the element is currently showing into a canvas.
   *
   * Nothing is seeked. The settled frame is by definition where the playhead
   * already is, and seeking the displayed element from here would fight the
   * scrub queue that put it there.
   *
   * @param isStillWanted - Consulted after the paint wait and before the draw.
   *   A read that has been superseded must not reach the canvas, and checking
   *   once the pixels are already there is too late — the older frame is on
   *   screen by then, which is the frame workers reported settling on.
   * @returns Whether a frame was drawn.
   */
  const drawFrameInto = useCallback(
    (
      canvas: HTMLCanvasElement,
      time: number,
      isStillWanted?: () => boolean,
    ): Promise<boolean> =>
      enqueue(async () => {
        // Cheap exit before taking a turn: by the time a queued read runs, the
        // pointer has often moved on.
        if (isStillWanted && !isStillWanted()) {
          return false;
        }
        const video = videoRef.current;
        if (!video || !video.videoWidth) {
          return false;
        }

        const startedAt = performance.now();
        await waitForPaint();
        const stillWanted = !isStillWanted || isStillWanted();

        if (isScrubProfilingEnabled()) {
          logScrubEvent("readerRead", {
            at: Math.round(time * 1000) / 1000,
            elementAt: Math.round(video.currentTime * 1000) / 1000,
            waitedMs: Math.round(performance.now() - startedAt),
            // A read the display no longer wants, stopped before it could paint.
            suppressed: !stillWanted,
          });
        }

        if (!stillWanted) {
          return false;
        }
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const context = canvas.getContext("2d");
        if (!context) {
          return false;
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return true;
      }),
    [enqueue, videoRef],
  );

  /**
   * Extract the frame at `time` as a screen image.
   *
   * Unlike the settled frame this does move the playhead, so it is only for
   * deliberate reads: `c` captures, and rebuilding screens during bootstrap.
   *
   * @returns Frame data, or null when the recording could not be read.
   */
  const extractFrameAt = useCallback(
    (
      time: number,
      options?: ExtractVideoFrameOptions,
    ): Promise<FrameData | null> =>
      // Same queue as the display reads, so a capture and a settled-frame paint
      // cannot become two seeks racing on one element.
      enqueue(async () => {
        const video = videoRef.current;
        if (!video) {
          return null;
        }
        // `waitForPaint` is the difference between the right timestamp with the
        // right picture and the right timestamp with the previous one.
        return extractVideoFrame(video, time, {
          ...options,
          waitForPaint: true,
        });
      }),
    [enqueue, videoRef],
  );

  return { drawFrameInto, extractFrameAt };
}
