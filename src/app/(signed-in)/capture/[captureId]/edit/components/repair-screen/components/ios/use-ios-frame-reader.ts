import { RefObject, useCallback, useEffect, useRef } from "react";
import { FrameData } from "../../../types";
import { ExtractVideoFrameOptions, extractVideoFrame } from "../../util";

/**
 * How long a reader stays trustworthy after its last use.
 *
 * WebKit suspends the video pipeline of an idle element. A seek on a suspended
 * element still moves `currentTime` and still fires `seeked` — the demuxer
 * answers — but no frame is pushed through, so `drawImage` keeps handing back
 * the last picture the element decoded. Measured directly: a read at 26.2s
 * returned the identical 36-point signature as one taken at 37.2s eleven
 * seconds of recording earlier, after four seconds of sitting still.
 *
 * A reader used within this window has not gone idle and can be reused; past
 * it, assume the pipeline has been suspended and start a fresh element.
 */
const READER_WARM_MS = 1500;

/**
 * Seek somewhere cheap first, to prime a newly created element.
 *
 * `extractVideoThumbnails` has always done this and its thumbnails have always
 * been correct, which is the strongest evidence available for what a working
 * read needs.
 */
const WARMUP_TIME_SECONDS = 0.1;
const WARMUP_SCALE = 0.05;

/**
 * Extracts screen images from the recording.
 *
 * Reads happen on a detached element rather than the displayed one, and — the
 * part that matters — on one that has not been left idle long enough for WebKit
 * to suspend it. Reading a stale surface is what put the right timestamp on the
 * wrong picture, in the panel and in captured screens both.
 *
 * A long-lived reader is not enough on its own: an earlier version kept exactly
 * one for the whole session and it froze on whatever bootstrap decoded last,
 * serving that same frame for every capture afterwards.
 *
 * @param videoRef - The displayed recording, used only for its source URL.
 */
export function useIosFrameReader(
  videoRef: RefObject<HTMLVideoElement | null>,
) {
  const readerRef = useRef<HTMLVideoElement | null>(null);
  const readerSrcRef = useRef<string | null>(null);
  const lastUsedAtRef = useRef(0);
  /**
   * Tail of the read queue. Two overlapping seeks on one element resolve on
   * each other's `seeked` and leave it somewhere neither caller asked for;
   * `extractVideoThumbnails` runs its own loop sequentially for this reason.
   */
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  const disposeReader = useCallback(() => {
    const reader = readerRef.current;
    readerRef.current = null;
    readerSrcRef.current = null;
    if (reader) {
      reader.removeAttribute("src");
      reader.load();
    }
  }, []);

  useEffect(() => disposeReader, [disposeReader]);

  /** Run `operation` once every read queued before it has finished. */
  const enqueue = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const run = queueRef.current.then(operation, operation);
    // Swallowed only for the chain's benefit: a rejected read must not stop the
    // reads behind it. The caller still sees the rejection through `run`.
    queueRef.current = run.catch(() => undefined);
    return run;
  }, []);

  /**
   * A reader whose pipeline is known to be awake.
   *
   * Reused during a burst — bootstrap rebuilding a draft's screens is a tight
   * loop and would otherwise pay for an element per screen — and replaced once
   * it has been sitting idle.
   */
  const getWarmReader = useCallback(
    async (src: string): Promise<HTMLVideoElement | null> => {
      const isWarm =
        readerRef.current !== null &&
        readerSrcRef.current === src &&
        performance.now() - lastUsedAtRef.current < READER_WARM_MS;
      if (isWarm) {
        return readerRef.current;
      }
      disposeReader();

      const reader = document.createElement("video");
      reader.crossOrigin = "anonymous";
      reader.preload = "auto";
      reader.muted = true;
      reader.src = src;

      const isReady = await new Promise<boolean>((resolve) => {
        const settle = (ready: boolean) => {
          reader.removeEventListener("loadeddata", onReady);
          reader.removeEventListener("error", onError);
          resolve(ready);
        };
        const onReady = () => settle(true);
        const onError = () => settle(false);
        reader.addEventListener("loadeddata", onReady, { once: true });
        reader.addEventListener("error", onError, { once: true });
      });
      if (!isReady) {
        return null;
      }

      // Prime the decoder before the read that matters.
      const warmup = await extractVideoFrame(reader, WARMUP_TIME_SECONDS, {
        scale: WARMUP_SCALE,
        mimeType: "image/jpeg",
        output: "object-url",
      });
      if (warmup.src?.startsWith("blob:")) {
        URL.revokeObjectURL(warmup.src);
      }

      readerRef.current = reader;
      readerSrcRef.current = src;
      return reader;
    },
    [disposeReader],
  );

  /**
   * Extract the frame at `time` as a screen image.
   *
   * @returns Frame data, or null when the recording could not be read.
   */
  const extractFrameAt = useCallback(
    (
      time: number,
      options?: ExtractVideoFrameOptions,
    ): Promise<FrameData | null> =>
      enqueue(async () => {
        const src = videoRef.current?.currentSrc || videoRef.current?.src;
        if (!src) {
          return null;
        }
        const reader = await getWarmReader(src);
        if (!reader) {
          return null;
        }
        try {
          return await extractVideoFrame(reader, time, options);
        } finally {
          lastUsedAtRef.current = performance.now();
        }
      }),
    [enqueue, getWarmReader, videoRef],
  );

  return { extractFrameAt };
}
