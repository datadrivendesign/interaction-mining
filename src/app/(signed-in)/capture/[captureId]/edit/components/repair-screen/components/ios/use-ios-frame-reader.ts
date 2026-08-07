import { useCallback, useEffect, useRef } from "react";
import { FrameData } from "../../../types";
import { extractVideoFrame } from "../../util";
import { isScrubProfilingEnabled, logScrubEvent } from "./scrub-profiler";

/**
 * Give up waiting on a seek after this long.
 *
 * Every read is queued behind the one before it, so a `seeked` that never
 * arrives would wedge the reader permanently rather than dropping one frame.
 * The spec lets a seek to the position the element already holds finish without
 * firing anything, which is the realistic way to get stuck here.
 */
const READER_SEEK_TIMEOUT_MS = 2000;

/**
 * Reads frames from an offscreen copy of the recording.
 *
 * Safari composites a visible video through a path canvas cannot read back:
 * `drawImage` on the displayed element returns black or a stale frame, and no
 * frame is ever "presented", so `requestVideoFrameCallback` never fires either.
 * That corrupted both the settled-frame display and — more seriously — captured
 * screens, which landed in traces with the right timestamp and the wrong image.
 *
 * An element that is never displayed does not take that path, which is why
 * thumbnail extraction was always correct. So every pixel read goes through one
 * here, and the visible element is left to do nothing but play.
 *
 * @param videoSrc - Source of the recording; the reader re-seeds when it changes.
 */
export function useIosFrameReader(videoSrc: string | undefined) {
  const readerRef = useRef<HTMLVideoElement | null>(null);
  const readyPromiseRef = useRef<Promise<HTMLVideoElement | null> | null>(null);
  /**
   * Where the decoder actually is, recorded only once a seek has completed.
   *
   * Deliberately not `reader.currentTime`. Assigning `currentTime` moves the
   * official playback position immediately, so the getter answers with the
   * position that was *requested* — it reads as "already there" the instant a
   * seek starts, while the element is still showing the previous frame.
   * Treating that as "no seek needed" is what painted a frame from an earlier
   * scrub over the settled one.
   */
  const settledTimeRef = useRef<number | null>(null);
  /**
   * Tail of the read queue.
   *
   * One element serves every reader — settled frames, captures, and the
   * bootstrap screen pass — and two overlapping seeks on one element resolve on
   * each other's `seeked`, leaving the decoder somewhere neither caller asked
   * for. `extractVideoThumbnails` learned this the hard way and runs its own
   * loop strictly sequentially ("parallel messes up seeking"); this applies the
   * same discipline to callers that cannot see each other.
   */
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const resetReader = useCallback(() => {
    readyPromiseRef.current = null;
    settledTimeRef.current = null;
    const reader = readerRef.current;
    readerRef.current = null;
    if (reader) {
      reader.removeAttribute("src");
      reader.load();
    }
  }, []);

  useEffect(() => {
    // Reset so the next read re-seeds against the new source.
    resetReader();
  }, [resetReader, videoSrc]);

  useEffect(() => {
    return () => {
      resetReader();
    };
  }, [resetReader]);

  /** Run `operation` once every read queued before it has finished. */
  const enqueue = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const run = queueRef.current.then(operation, operation);
    // Swallowed only for the chain's benefit: a rejected read must not stop the
    // reads behind it. The caller still sees the rejection through `run`.
    queueRef.current = run.catch(() => undefined);
    return run;
  }, []);

  /**
   * Put the decoder on `time` and wait until it is really there.
   *
   * @returns Whether the seek was skipped because the frame was already decoded.
   */
  const seekReader = useCallback(
    async (reader: HTMLVideoElement, time: number): Promise<boolean> => {
      const settled = settledTimeRef.current;
      if (settled !== null && Math.abs(settled - time) <= 0.001) {
        return true;
      }

      await new Promise<void>((resolve) => {
        let timeout: number | null = null;
        const finish = () => {
          if (timeout !== null) {
            window.clearTimeout(timeout);
          }
          reader.removeEventListener("seeked", finish);
          reader.removeEventListener("error", finish);
          resolve();
        };
        timeout = window.setTimeout(finish, READER_SEEK_TIMEOUT_MS);
        reader.addEventListener("seeked", finish, { once: true });
        reader.addEventListener("error", finish, { once: true });
        reader.currentTime = time;
      });

      settledTimeRef.current = reader.currentTime;
      return false;
    },
    [],
  );

  /** The offscreen element, created and loaded once per source. */
  const getReader = useCallback(() => {
    if (!videoSrc) {
      return Promise.resolve(null);
    }
    if (readyPromiseRef.current) {
      return readyPromiseRef.current;
    }

    readyPromiseRef.current = new Promise<HTMLVideoElement | null>(
      (resolve) => {
        const reader = document.createElement("video");
        reader.crossOrigin = "anonymous";
        reader.preload = "auto";
        reader.muted = true;
        // Never attached to the document, so it cannot be composited.
        reader.src = videoSrc;

        const onReady = () => {
          reader.removeEventListener("loadeddata", onReady);
          reader.removeEventListener("error", onError);
          readerRef.current = reader;
          resolve(reader);
        };
        const onError = () => {
          reader.removeEventListener("loadeddata", onReady);
          reader.removeEventListener("error", onError);
          readyPromiseRef.current = null;
          resolve(null);
        };

        reader.addEventListener("loadeddata", onReady, { once: true });
        reader.addEventListener("error", onError, { once: true });
      },
    );
    return readyPromiseRef.current;
  }, [videoSrc]);

  /**
   * Paint the frame at `time` straight into a canvas.
   *
   * For display: no encode, no blob, nothing to revoke.
   *
   * @param isStillWanted - Consulted after the seek and before the paint. A read
   *   that has been superseded must not reach the canvas, and checking once the
   *   pixels are already there is too late — the older frame is on screen by
   *   then, which is precisely the frame workers reported settling on.
   * @returns Whether a frame was drawn.
   */
  const drawFrameInto = useCallback(
    (
      canvas: HTMLCanvasElement,
      time: number,
      isStillWanted?: () => boolean,
    ): Promise<boolean> =>
      enqueue(async () => {
        // Cheap exit before taking the decoder: by the time a queued read runs,
        // the pointer has often moved on.
        if (isStillWanted && !isStillWanted()) {
          return false;
        }
        const reader = await getReader();
        if (!reader || !reader.videoWidth) {
          return false;
        }

        const startedAt = performance.now();
        const wasAlreadyDecoded = await seekReader(reader, time);
        const stillWanted = !isStillWanted || isStillWanted();

        if (isScrubProfilingEnabled()) {
          logScrubEvent("readerRead", {
            at: Math.round(time * 1000) / 1000,
            settledAt: settledTimeRef.current,
            // True means the frame was served without waiting, which is only
            // sound now that it is judged on a completed seek.
            cached: wasAlreadyDecoded,
            waitedMs: Math.round(performance.now() - startedAt),
            // A read the display no longer wants, stopped before it could paint.
            suppressed: !stillWanted,
          });
        }

        if (!stillWanted) {
          return false;
        }
        if (canvas.width !== reader.videoWidth) {
          canvas.width = reader.videoWidth;
          canvas.height = reader.videoHeight;
        }
        const context = canvas.getContext("2d");
        if (!context) {
          return false;
        }
        context.drawImage(reader, 0, 0, canvas.width, canvas.height);
        return true;
      }),
    [enqueue, getReader, seekReader],
  );

  /**
   * Extract the frame at `time` as a screen image.
   *
   * @returns Frame data, or null when the recording could not be read.
   */
  const extractFrameAt = useCallback(
    (
      time: number,
      options?: Parameters<typeof extractVideoFrame>[2],
    ): Promise<FrameData | null> =>
      // Same queue as the display reads. A capture and a settled-frame paint
      // that overlap are two seeks on one element, and the loser gets whatever
      // the winner left behind.
      enqueue(async () => {
        const reader = await getReader();
        if (!reader) {
          return null;
        }
        try {
          return await extractVideoFrame(reader, time, options);
        } finally {
          // `extractVideoFrame` seeks the element itself, so the record of
          // where the decoder sits has to be brought back into line.
          settledTimeRef.current = reader.currentTime;
        }
      }),
    [enqueue, getReader],
  );

  return { drawFrameInto, extractFrameAt };
}
