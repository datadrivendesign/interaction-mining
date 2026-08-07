import { useCallback, useEffect, useRef } from "react";
import { FrameData } from "../../../types";
import { extractVideoFrame } from "../../util";

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

  useEffect(() => {
    // Reset so the next read re-seeds against the new source.
    readyPromiseRef.current = null;
    const reader = readerRef.current;
    readerRef.current = null;
    if (reader) {
      reader.removeAttribute("src");
      reader.load();
    }
  }, [videoSrc]);

  useEffect(() => {
    return () => {
      const reader = readerRef.current;
      readerRef.current = null;
      readyPromiseRef.current = null;
      if (reader) {
        reader.removeAttribute("src");
        reader.load();
      }
    };
  }, []);

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
   * @returns Whether a frame was drawn.
   */
  const drawFrameInto = useCallback(
    async (canvas: HTMLCanvasElement, time: number): Promise<boolean> => {
      const reader = await getReader();
      if (!reader || !reader.videoWidth) {
        return false;
      }
      if (Math.abs(reader.currentTime - time) > 0.001) {
        const seeked = new Promise<void>((resolve) => {
          const onSeeked = () => {
            reader.removeEventListener("seeked", onSeeked);
            resolve();
          };
          reader.addEventListener("seeked", onSeeked, { once: true });
        });
        reader.currentTime = time;
        await seeked;
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
    },
    [getReader],
  );

  /**
   * Extract the frame at `time` as a screen image.
   *
   * @returns Frame data, or null when the recording could not be read.
   */
  const extractFrameAt = useCallback(
    async (
      time: number,
      options?: Parameters<typeof extractVideoFrame>[2],
    ): Promise<FrameData | null> => {
      const reader = await getReader();
      if (!reader) {
        return null;
      }
      return extractVideoFrame(reader, time, options);
    },
    [getReader],
  );

  return { drawFrameInto, extractFrameAt };
}
