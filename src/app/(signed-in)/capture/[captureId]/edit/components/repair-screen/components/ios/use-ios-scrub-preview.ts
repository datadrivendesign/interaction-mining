import {
  MutableRefObject,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


import {
  isScrubProfilingEnabled,
  logScrubEvent,
  recordPreviewSwapWithoutLoad,
  recordReveal,
  recordSeekIssued,
} from "./scrub-profiler";
import {
  PREVIEW_MATCH_TOLERANCE,
  PREVIEW_REVEAL_TIMEOUT_MS,
  PREVIEW_SWAP_DELAY_MS,
  PREVIEW_SWAP_WATCHDOG_MS,
  PreviewThumbnail,
  SCRUB_SEEK_INTERVAL_MS,
  findNearestPreviewThumbnail,
} from "./ios-helpers";

/**
 * `requestVideoFrameCallback` is not in every TypeScript DOM lib, and is absent
 * on older browsers, so it is described here and feature-detected at the call
 * site rather than assumed.
 */
type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

interface UseIosScrubPreviewArgs {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Canvas the settled frame is painted into. */
  settledFrameCanvasRef: RefObject<HTMLCanvasElement | null>;
  /**
   * Paints the frame at a given time into a canvas, reading from an offscreen
   * copy of the recording. Never reads the displayed element: Safari composites
   * that through a path canvas cannot read back, returning black.
   */
  drawFrameInto: (canvas: HTMLCanvasElement, time: number) => Promise<boolean>;
  videoDuration: number;
  isPlaying: boolean;
  previewThumbnails: PreviewThumbnail[];
  currentTime: number;
  updateCurrentTime: (time: number) => void;
  livePhotoEndRef: MutableRefObject<number | null>;
  setIsLivePhotoActive: (active: boolean) => void;
  syncFocusToTimestamp: (time: number) => void;
}

/**
 * Draws the displayed element into a scratch canvas and measures it, so the two
 * sources can be compared under the same ruler.
 */
function describeElement(
  video: HTMLVideoElement | null,
  time: number,
): Record<string, unknown> {
  if (!video || !video.videoWidth) {
    return { unavailable: true };
  }
  try {
    const scratch = document.createElement("canvas");
    scratch.width = video.videoWidth;
    scratch.height = video.videoHeight;
    const context = scratch.getContext("2d");
    if (!context) {
      return { noContext: true };
    }
    context.drawImage(video, 0, 0, scratch.width, scratch.height);
    return {
      ...describeCanvas(context, scratch),
      elementTime: Math.round(video.currentTime * 1000) / 1000,
      requested: Math.round(time * 1000) / 1000,
    };
  } catch (error) {
    return { failed: String(error).slice(0, 60) };
  }
}

/**
 * Describes what is actually on a canvas.
 *
 * The previous version sampled five points along the diagonal, which on a
 * letterboxed recording lands in the black bars — reporting uniform black for
 * every frame regardless of content, and sending two investigations down the
 * wrong path. This samples a grid across the whole frame and reports the spread,
 * so "uniformly blank" and "real content" cannot be confused.
 */
function describeCanvas(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
): Record<string, unknown> {
  try {
    const steps = 7;
    const luminances: number[] = [];
    let signature = 0;
    for (let row = 1; row < steps; row += 1) {
      for (let column = 1; column < steps; column += 1) {
        const x = Math.floor((canvas.width * column) / steps);
        const y = Math.floor((canvas.height * row) / steps);
        const [r, g, b] = context.getImageData(x, y, 1, 1).data;
        luminances.push(0.299 * r + 0.587 * g + 0.114 * b);
        // Order-dependent rolling signature, so two different frames rarely match.
        signature = (signature * 31 + r * 65536 + g * 256 + b) % 1000000007;
      }
    }
    const min = Math.min(...luminances);
    const max = Math.max(...luminances);
    const mean =
      luminances.reduce((sum, value) => sum + value, 0) / luminances.length;
    return {
      size: `${canvas.width}x${canvas.height}`,
      lumaMin: Math.round(min),
      lumaMax: Math.round(max),
      lumaMean: Math.round(mean),
      // A frame with no spread across 36 points is blank, not content.
      looksBlank: max - min < 4,
      signature,
    };
  } catch (error) {
    return { unreadable: String(error).slice(0, 60) };
  }
}

export function useIosScrubPreview({
  videoRef,
  settledFrameCanvasRef,
  drawFrameInto,
  videoDuration,
  isPlaying,
  previewThumbnails,
  currentTime,
  updateCurrentTime,
  livePhotoEndRef,
  setIsLivePhotoActive,
  syncFocusToTimestamp,
}: UseIosScrubPreviewArgs) {
  const pendingSeekTimeRef = useRef<number | null>(null);
  const isSeekInFlightRef = useRef(false);
  const scrubPreviewTimeRef = useRef<number | null>(null);
  const isScrubPreviewActiveRef = useRef(false);
  const scrubQueuedSeekTimeRef = useRef<number | null>(null);
  const scrubSeekTimeoutRef = useRef<number | null>(null);
  const lastScrubSeekAtRef = useRef(0);
  const pendingScrubDisplayTimeRef = useRef<number | null>(null);
  const scrubDisplayRafRef = useRef<number | null>(null);
  const previewSwapTimeoutRef = useRef<number | null>(null);
  const lastCommittedVideoTimeRef = useRef<number | null>(null);
  const activePreviewFrameSrcRef = useRef<string | null>(null);
  /** The moment the display is trying to represent, wherever the request came from. */
  const previewTargetTimeRef = useRef<number | null>(null);
  /**
   * Target of the last seek that actually finished.
   *
   * Not the same as `video.currentTime`, and the difference is the whole point:
   * assigning `currentTime` moves the official playback position immediately, so
   * reads report where the element was *asked* to go, not what it is showing. On
   * a fast drag more than half of seeks are superseded before completing, so the
   * painted frame can be several positions behind what `currentTime` claims.
   */
  const settledSeekTargetRef = useRef<number | null>(null);
  const frameCallbackHandleRef = useRef<number | null>(null);
  /** Invalidates an in-flight frame read when a newer one starts. */
  const revealTokenRef = useRef(0);
  /** The control only needs measuring once per session. */
  const controlMeasuredRef = useRef(false);
  const revealFallbackTimeoutRef = useRef<number | null>(null);

  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);
  const [pausedPreviewTime, setPausedPreviewTime] = useState<number | null>(
    null,
  );
  const [displayedPreviewFrameSrc, setDisplayedPreviewFrameSrc] = useState<
    string | null
  >(null);
  const [incomingPreviewFrameSrc, setIncomingPreviewFrameSrc] = useState<
    string | null
  >(null);
  const [isIncomingPreviewVisible, setIsIncomingPreviewVisible] =
    useState(false);
  /**
   * Whether the thumbnail is still needed.
   *
   * Separate from `scrubPreviewTime`, which is where the *pointer* is and must
   * keep driving the timeline marker for the whole drag. Conflating the two is
   * why the thumbnail could not be taken down mid-drag: hiding it meant clearing
   * the pointer position, which would have snapped the marker backwards.
   */
  const [isPreviewNeeded, setIsPreviewNeeded] = useState(false);
  /**
   * Whether the canvas holding the settled frame should be shown.
   *
   * Safari does not composite a new frame for a paused video after a seek, so
   * the element can keep displaying an earlier position indefinitely — the
   * wrong-frame reports. Its decoder is correct, though, which is why captured
   * screens were always right, so the settled frame is read out with drawImage
   * and displayed from a canvas rather than trusting the element to repaint.
   */
  const [isSettledFrameVisible, setIsSettledFrameVisible] = useState(false);

  const getNearestPreviewThumbnail = useCallback(
    (time: number) => findNearestPreviewThumbnail(previewThumbnails, time),
    [previewThumbnails],
  );

  /** Measures a preview thumbnail the same way, to calibrate the frame reading. */
  const describeThumbnailControl = useCallback(async (src: string | null) => {
    if (controlMeasuredRef.current) {
      return;
    }
    if (!src) {
      logScrubEvent("thumbnailControl", { skipped: "no thumbnail yet" });
      return;
    }
    controlMeasuredRef.current = true;
    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("control image failed"));
        image.src = src;
      });
      const scratch = document.createElement("canvas");
      scratch.width = image.naturalWidth;
      scratch.height = image.naturalHeight;
      const context = scratch.getContext("2d");
      if (!context) {
        return;
      }
      context.drawImage(image, 0, 0);
      logScrubEvent("thumbnailControl", describeCanvas(context, scratch));
    } catch (error) {
      logScrubEvent("thumbnailControl", { failed: String(error).slice(0, 60) });
    }
  }, []);

  /**
   * Paint the frame the element is currently decoding into the canvas.
   *
   * Synchronous and cheap — no encode, no blob. Reads from the decoder, so it is
   * correct even when the element is compositing something older.
   *
   * @returns Whether a frame was drawn.
   */
  const drawSettledFrame = useCallback(
    async (time: number) => {
      const canvas = settledFrameCanvasRef.current;
      if (!canvas) {
        return false;
      }
      try {
        const drew = await drawFrameInto(canvas, time);
        if (drew && isScrubProfilingEnabled()) {
          const context = canvas.getContext("2d");
          // Both sources measured at the same moment, because we have no valid
          // reading for either yet — the earlier diagonal sampling was constant
          // regardless of content, so the displayed element was never actually
          // ruled out. Whichever signature varies with time is the one that
          // works.
          logScrubEvent("frameSources", {
            at: Math.round(time * 1000) / 1000,
            reader: context ? describeCanvas(context, canvas) : { noContext: true },
            live: describeElement(videoRef.current, time),
          });
          void describeThumbnailControl(
            getNearestPreviewThumbnail(time)?.src ?? null,
          );
        }
        return drew;
      } catch (error) {
        console.error(`Could not draw settled frame: ${error}`);
        return false;
      }
    },
    [
      describeThumbnailControl,
      drawFrameInto,
      getNearestPreviewThumbnail,
      settledFrameCanvasRef,
      videoRef,
    ],
  );

  const cancelPendingReveal = useCallback(() => {
    const video = videoRef.current as VideoWithFrameCallback | null;
    if (frameCallbackHandleRef.current !== null) {
      video?.cancelVideoFrameCallback?.(frameCallbackHandleRef.current);
      frameCallbackHandleRef.current = null;
    }
    if (revealFallbackTimeoutRef.current !== null) {
      window.clearTimeout(revealFallbackTimeoutRef.current);
      revealFallbackTimeoutRef.current = null;
    }
  }, [videoRef]);

  /**
   * Uncover the element once it has actually presented a frame.
   *
   * `seeked` only says the seek finished, not that anything has been painted,
   * and uncovering in that gap is what showed a blank flash before the frame
   * appeared. `requestVideoFrameCallback` fires on presentation, which is the
   * event we actually want. A timeout backs it up: on a browser that does not
   * implement it, or does not fire it for a paused element, the reveal still
   * happens rather than leaving the thumbnail up for good.
   */
  const revealWhenFramePresented = useCallback(() => {
    cancelPendingReveal();

    const reveal = async (
      source: "frame-callback" | "timeout",
      mediaTime: number | null,
    ) => {
      cancelPendingReveal();
      const settledTarget = settledSeekTargetRef.current;
      const revealToken = ++revealTokenRef.current;

      const didDraw =
        settledTarget === null ? false : await drawSettledFrame(settledTarget);

      // Reading a frame means seeking the offscreen copy, so the pointer may
      // have moved on meanwhile. Showing this frame now would put an older
      // moment on screen — the exact fault being fixed.
      if (revealToken !== revealTokenRef.current) {
        return;
      }

      recordReveal({
        source,
        targetTime: previewTargetTimeRef.current,
        mediaTime,
        settledTarget,
        paintedToCanvas: didDraw,
      });
      setIsSettledFrameVisible(didDraw);
      // Only drop the thumbnail once something real is on the canvas; otherwise
      // the approximate frame is still the best thing available.
      if (didDraw) {
        setIsPreviewNeeded(false);
      }
    };

    const video = videoRef.current as VideoWithFrameCallback | null;
    revealFallbackTimeoutRef.current = window.setTimeout(
      () => void reveal("timeout", null),
      PREVIEW_REVEAL_TIMEOUT_MS,
    );

    if (video && typeof video.requestVideoFrameCallback === "function") {
      frameCallbackHandleRef.current = video.requestVideoFrameCallback(
        (_now, metadata) => void reveal("frame-callback", metadata.mediaTime),
      );
    }
  }, [cancelPendingReveal, drawSettledFrame, videoRef]);

  /**
   * Ask for the thumbnail to cover a move to `time` — but only when it would be
   * an improvement on what is already displayed.
   *
   * Once the real frame is on screen, a small nudge should keep it: the element
   * is showing a frame a few hundredths of a second away, while the nearest
   * thumbnail can be half a second off. Swapping to the thumbnail would be a
   * downgrade, and doing that on every small movement is what would make the
   * panel strobe between the two sources.
   */
  const requestPreviewFor = useCallback(
    (time: number) => {
      // Any pending reveal is now stale — the display is being sent somewhere
      // else, so a frame read for the previous target must not reach the canvas.
      cancelPendingReveal();
      revealTokenRef.current += 1;

      setIsPreviewNeeded((wasNeeded) => {
        if (wasNeeded) {
          return true;
        }
        if (isScrubProfilingEnabled()) {
          const thumbnail = getNearestPreviewThumbnail(time);
          logScrubEvent("previewRequested", {
            target: Math.round(time * 1000) / 1000,
            landed: videoRef.current?.currentTime ?? null,
            thumbnailAt: thumbnail?.timestamp ?? null,
          });
        }
        // Measured from the last completed seek. Using `currentTime` here made
        // the element look perfectly current the instant a seek was requested,
        // so the thumbnail was judged worse and suppressed — leaving a stale
        // frame on screen during exactly the drags where it lags most.
        const landed = settledSeekTargetRef.current;
        if (landed === null) {
          return true;
        }
        const thumbnail = getNearestPreviewThumbnail(time);
        if (!thumbnail) {
          return false;
        }
        return Math.abs(thumbnail.timestamp - time) < Math.abs(landed - time);
      });
    },
    [cancelPendingReveal, getNearestPreviewThumbnail, videoRef],
  );

  const activePreviewFrameSrc = useMemo(() => {
    if (!isPreviewNeeded) {
      return null;
    }
    const sourceTime = scrubPreviewTime ?? pausedPreviewTime;
    if (sourceTime === null) {
      return null;
    }
    return getNearestPreviewThumbnail(sourceTime)?.src ?? null;
  }, [
    getNearestPreviewThumbnail,
    isPreviewNeeded,
    pausedPreviewTime,
    scrubPreviewTime,
  ]);

  const displayedTimelineTime = scrubPreviewTime ?? currentTime;
  const hasPreviewOverlay =
    displayedPreviewFrameSrc !== null || incomingPreviewFrameSrc !== null;

  useEffect(() => {
    activePreviewFrameSrcRef.current = activePreviewFrameSrc;
  }, [activePreviewFrameSrc]);

  // Reset all preview frame state. Used by bootstrap on video reload and live-photo start.
  const resetPreviewFrames = useCallback(() => {
    setIsPreviewNeeded(false);
    setDisplayedPreviewFrameSrc(null);
    setIncomingPreviewFrameSrc(null);
    setIsIncomingPreviewVisible(false);
  }, []);

  // Clear scrub state whenever the video starts playing.
  useEffect(() => {
    if (isPlaying) {
      if (scrubSeekTimeoutRef.current !== null) {
        window.clearTimeout(scrubSeekTimeoutRef.current);
        scrubSeekTimeoutRef.current = null;
      }
      if (scrubDisplayRafRef.current !== null) {
        cancelAnimationFrame(scrubDisplayRafRef.current);
        scrubDisplayRafRef.current = null;
      }
      scrubQueuedSeekTimeRef.current = null;
      pendingScrubDisplayTimeRef.current = null;
      isScrubPreviewActiveRef.current = false;
      scrubPreviewTimeRef.current = null;
      previewTargetTimeRef.current = null;
      setScrubPreviewTime(null);
      setPausedPreviewTime(null);
      setIsPreviewNeeded(false);
      // Playing composites normally, so the element is trustworthy again.
      setIsSettledFrameVisible(false);
      setDisplayedPreviewFrameSrc(null);
      setIncomingPreviewFrameSrc(null);
      setIsIncomingPreviewVisible(false);
    }
  }, [isPlaying]);

  // Wire the seek queue to the video's "seeked" event.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const commitSeek = (nextTime: number) => {
      isSeekInFlightRef.current = true;
      pendingSeekTimeRef.current = nextTime;
      video.currentTime = nextTime;
      recordSeekIssued(video, nextTime);
      if (scrubPreviewTimeRef.current === null) {
        lastCommittedVideoTimeRef.current = nextTime;
        updateCurrentTime(nextTime);
      }
    };

    const syncSeekTime = () => {
      const queuedTime = pendingSeekTimeRef.current;
      const currentVideoTime = video.currentTime;
      const lastCommittedVideoTime = lastCommittedVideoTimeRef.current;
      const hasQueuedFollowUp =
        queuedTime !== null && Math.abs(queuedTime - currentVideoTime) > 0.001;

      if (hasQueuedFollowUp) {
        requestAnimationFrame(() => {
          if (pendingSeekTimeRef.current === null) {
            return;
          }

          if (
            Math.abs(pendingSeekTimeRef.current - video.currentTime) <= 0.001
          ) {
            isSeekInFlightRef.current = false;
            pendingSeekTimeRef.current = null;
            if (
              scrubPreviewTimeRef.current === null &&
              (lastCommittedVideoTimeRef.current === null ||
                Math.abs(
                  lastCommittedVideoTimeRef.current - video.currentTime,
                ) > 0.001)
            ) {
              lastCommittedVideoTimeRef.current = video.currentTime;
              updateCurrentTime(video.currentTime);
            }
            return;
          }

          commitSeek(pendingSeekTimeRef.current);
        });
        return;
      }

      requestAnimationFrame(() => {
        isSeekInFlightRef.current = false;
        pendingSeekTimeRef.current = null;

        // This seek finished with nothing queued behind it, so its target is what
        // the element is now painting.
        settledSeekTargetRef.current = video.currentTime;

        // Has the playhead come to rest? The drag is over and nothing newer is
        // queued, so wherever the element landed is the final position.
        //
        // Deliberately not an exact comparison against the requested time.
        // Browsers snap `currentTime` to the nearest decodable frame, so the
        // landed value usually differs by more than a millisecond — gating on an
        // exact match left the coarse thumbnail up at random, which is why the
        // preview and the real frame sometimes still disagreed after mouseup.
        const hasPlayheadSettled =
          !isScrubPreviewActiveRef.current &&
          scrubQueuedSeekTimeRef.current === null &&
          scrubSeekTimeoutRef.current === null;

        if (hasPlayheadSettled && scrubPreviewTimeRef.current !== null) {
          scrubPreviewTimeRef.current = null;
          setScrubPreviewTime(null);
        }

        // Mid-drag reveal. Nothing further is queued, so this frame is where the
        // pointer is pointing — and the real element is showing it, while the
        // thumbnail is a nearest-neighbour guess up to half a second away.
        // Holding still during a drag now shows the truth rather than saving it
        // for mouse-up, which is what made the picture change under the worker
        // just as they decided what to capture.
        const previewTarget = previewTargetTimeRef.current;
        const settledTarget = settledSeekTargetRef.current;
        // Compared against the seek that completed, not against currentTime.
        // currentTime reports the request, so comparing it to the target was
        // comparing the target with itself — always "caught up", which uncovered
        // the element while it was still painting an earlier position.
        const hasCaughtUp =
          scrubQueuedSeekTimeRef.current === null &&
          scrubSeekTimeoutRef.current === null &&
          previewTarget !== null &&
          settledTarget !== null &&
          Math.abs(settledTarget - previewTarget) <= PREVIEW_MATCH_TOLERANCE;

        if (hasCaughtUp) {
          revealWhenFramePresented();
        }

        if (
          scrubPreviewTimeRef.current === null &&
          (lastCommittedVideoTime === null ||
            Math.abs(lastCommittedVideoTime - video.currentTime) > 0.001)
        ) {
          lastCommittedVideoTimeRef.current = video.currentTime;
          updateCurrentTime(video.currentTime);
        }

        // Reveal the real frame. The overlay is only meant to cover seek
        // latency, but a preview thumbnail is a nearest-neighbour pick off a
        // coarse grid — roughly 1.2s apart on a long recording, so up to ~0.6s
        // from the playhead. Leaving it up means the worker aims with an image
        // that can be half a second stale while `c` captures the accurate frame
        // underneath it.
        if (hasPlayheadSettled) {
          setPausedPreviewTime(null);
        }
      });
    };
    video.addEventListener("seeked", syncSeekTime);
    return () => {
      video.removeEventListener("seeked", syncSeekTime);
    };
  }, [revealWhenFramePresented, updateCurrentTime, videoRef]);

  // Cleanup all timers/RAFs on unmount.
  useEffect(() => {
    return () => {
      cancelPendingReveal();
      if (scrubSeekTimeoutRef.current !== null) {
        window.clearTimeout(scrubSeekTimeoutRef.current);
      }
      if (scrubDisplayRafRef.current !== null) {
        cancelAnimationFrame(scrubDisplayRafRef.current);
      }
      if (previewSwapTimeoutRef.current !== null) {
        window.clearTimeout(previewSwapTimeoutRef.current);
      }
    };
  }, [cancelPendingReveal]);

  // Cross-fade swap between displayed and incoming preview frames.
  useEffect(() => {
    if (previewSwapTimeoutRef.current !== null) {
      window.clearTimeout(previewSwapTimeoutRef.current);
      previewSwapTimeoutRef.current = null;
    }

    if (!activePreviewFrameSrc) {
      setDisplayedPreviewFrameSrc(null);
      setIncomingPreviewFrameSrc(null);
      setIsIncomingPreviewVisible(false);
      return;
    }

    if (!displayedPreviewFrameSrc) {
      setDisplayedPreviewFrameSrc(activePreviewFrameSrc);
      setIncomingPreviewFrameSrc(null);
      setIsIncomingPreviewVisible(false);
      return;
    }

    if (displayedPreviewFrameSrc === activePreviewFrameSrc) {
      setIncomingPreviewFrameSrc(null);
      setIsIncomingPreviewVisible(false);
      return;
    }

    setIncomingPreviewFrameSrc(activePreviewFrameSrc);
    setIsIncomingPreviewVisible(false);

    // Watchdog for the swap never completing. `displayedPreviewFrameSrc` only
    // advances once the incoming image reports `onLoad`, so if Safari skips that
    // for a cached blob the previous thumbnail stays on screen — which would
    // look exactly like settling on a frame from an earlier scrub.
    if (!isScrubProfilingEnabled()) {
      return;
    }
    const watchedSrc = activePreviewFrameSrc;
    logScrubEvent("previewSwapStarted", { src: watchedSrc.slice(-12) });
    const watchdog = window.setTimeout(() => {
      if (activePreviewFrameSrcRef.current === watchedSrc) {
        recordPreviewSwapWithoutLoad(watchedSrc);
      }
    }, PREVIEW_SWAP_WATCHDOG_MS);
    return () => window.clearTimeout(watchdog);
  }, [activePreviewFrameSrc, displayedPreviewFrameSrc]);

  const handleIncomingPreviewLoad = useCallback((loadedSrc: string) => {
    logScrubEvent("previewImageLoaded", {
      src: loadedSrc.slice(-12),
      stillWanted: loadedSrc === activePreviewFrameSrcRef.current,
    });
    if (loadedSrc !== activePreviewFrameSrcRef.current) {
      return;
    }

    setIsIncomingPreviewVisible(true);

    if (previewSwapTimeoutRef.current !== null) {
      window.clearTimeout(previewSwapTimeoutRef.current);
    }

    previewSwapTimeoutRef.current = window.setTimeout(() => {
      if (loadedSrc !== activePreviewFrameSrcRef.current) {
        previewSwapTimeoutRef.current = null;
        return;
      }

      setDisplayedPreviewFrameSrc(loadedSrc);
      setIncomingPreviewFrameSrc((currentIncomingSrc) =>
        currentIncomingSrc === loadedSrc ? null : currentIncomingSrc,
      );
      setIsIncomingPreviewVisible(false);
      previewSwapTimeoutRef.current = null;
    }, PREVIEW_SWAP_DELAY_MS);
  }, []);

  const handleSetTime = useCallback(
    (t: number, options?: { syncFocus?: boolean }) => {
      if (!Number.isFinite(t)) return;

      // Cancel any active live photo auto-stop on manual seek.
      livePhotoEndRef.current = null;
      setIsLivePhotoActive(false);

      if (t < 0) {
        t = 0;
      } else if (t > videoDuration) {
        t = videoDuration;
      }

      t = Math.max(0, Math.min(t, videoDuration));

      // Opt-in. A seek only drags the focused screen along when the seek itself
      // was the worker's intent — scrubbing, frame stepping, the ±5s keys. A seek
      // that exists because a screen was selected must not reassign selection.
      if (options?.syncFocus) {
        syncFocusToTimestamp(t);
      }

      const video = videoRef.current;
      if (!video) return;
      video.pause();
      previewTargetTimeRef.current = t;
      requestPreviewFor(t);
      if (scrubPreviewTimeRef.current === null) {
        setPausedPreviewTime(t);
      }
      if (isSeekInFlightRef.current) {
        pendingSeekTimeRef.current = t;
        updateCurrentTime(t);
        return;
      }

      isSeekInFlightRef.current = true;
      pendingSeekTimeRef.current = t;
      video.currentTime = t;
      recordSeekIssued(video, t);
      updateCurrentTime(t);
    },
    [
      livePhotoEndRef,
      requestPreviewFor,
      setIsLivePhotoActive,
      syncFocusToTimestamp,
      updateCurrentTime,
      videoDuration,
      videoRef,
    ],
  );

  const scheduleScrubSeek = useCallback(
    (
      targetTime: number,
      immediate: boolean = false,
      syncFocus: boolean = false,
    ) => {
      if (!Number.isFinite(targetTime)) {
        return;
      }

      scrubQueuedSeekTimeRef.current = targetTime;

      if (scrubSeekTimeoutRef.current !== null) {
        window.clearTimeout(scrubSeekTimeoutRef.current);
        scrubSeekTimeoutRef.current = null;
      }

      const commitScheduledSeek = () => {
        scrubSeekTimeoutRef.current = null;
        const queuedTime = scrubQueuedSeekTimeRef.current;
        scrubQueuedSeekTimeRef.current = null;
        if (queuedTime === null) {
          return;
        }
        lastScrubSeekAtRef.current = performance.now();
        handleSetTime(queuedTime, { syncFocus });
      };

      if (immediate) {
        commitScheduledSeek();
        return;
      }

      const elapsed = performance.now() - lastScrubSeekAtRef.current;
      const delay = Math.max(SCRUB_SEEK_INTERVAL_MS - elapsed, 0);

      if (delay === 0) {
        commitScheduledSeek();
        return;
      }

      scrubSeekTimeoutRef.current = window.setTimeout(
        commitScheduledSeek,
        delay,
      );
    },
    [handleSetTime],
  );

  const flushScrubDisplayTime = useCallback(() => {
    scrubDisplayRafRef.current = null;
    const nextTime = pendingScrubDisplayTimeRef.current;
    scrubPreviewTimeRef.current = nextTime;
    previewTargetTimeRef.current = nextTime;
    if (nextTime !== null) {
      requestPreviewFor(nextTime);
    }
    setScrubPreviewTime(nextTime);

    if (nextTime === null || !isScrubPreviewActiveRef.current) {
      return;
    }

    scheduleScrubSeek(nextTime, false, false);
  }, [requestPreviewFor, scheduleScrubSeek]);

  const scheduleScrubDisplayTime = useCallback(
    (time: number | null, immediate: boolean = false) => {
      pendingScrubDisplayTimeRef.current = time;

      if (immediate) {
        if (scrubDisplayRafRef.current !== null) {
          cancelAnimationFrame(scrubDisplayRafRef.current);
          scrubDisplayRafRef.current = null;
        }
        flushScrubDisplayTime();
        return;
      }

      if (scrubDisplayRafRef.current !== null) {
        return;
      }

      scrubDisplayRafRef.current = requestAnimationFrame(flushScrubDisplayTime);
    },
    [flushScrubDisplayTime],
  );

  const handleScrubPreviewTimeChange = useCallback(
    (time: number | null) => {
      if (time === null) {
        if (scrubDisplayRafRef.current !== null) {
          cancelAnimationFrame(scrubDisplayRafRef.current);
          scrubDisplayRafRef.current = null;
        }
        pendingScrubDisplayTimeRef.current = null;
        scrubPreviewTimeRef.current = null;
        setScrubPreviewTime(null);
        return;
      }

      scheduleScrubDisplayTime(time);
    },
    [scheduleScrubDisplayTime],
  );

  const handleScrubActiveChange = useCallback((active: boolean) => {
    isScrubPreviewActiveRef.current = active;

    if (active) {
      setPausedPreviewTime(null);
    }

    if (!active && scrubPreviewTimeRef.current === null) {
      pendingScrubDisplayTimeRef.current = null;
      scrubQueuedSeekTimeRef.current = null;
      if (scrubSeekTimeoutRef.current !== null) {
        window.clearTimeout(scrubSeekTimeoutRef.current);
        scrubSeekTimeoutRef.current = null;
      }
      if (scrubDisplayRafRef.current !== null) {
        cancelAnimationFrame(scrubDisplayRafRef.current);
        scrubDisplayRafRef.current = null;
      }
    }
  }, []);

  const handleScrubCommit = useCallback(
    (time: number) => {
      if (scrubDisplayRafRef.current !== null) {
        cancelAnimationFrame(scrubDisplayRafRef.current);
        scrubDisplayRafRef.current = null;
      }
      pendingScrubDisplayTimeRef.current = time;
      scrubPreviewTimeRef.current = time;
      setScrubPreviewTime(time);
      setPausedPreviewTime(time);
      scheduleScrubSeek(time, true, true);
    },
    [scheduleScrubSeek],
  );

  return {
    scrubPreviewTime,
    pausedPreviewTime,
    setPausedPreviewTime,
    displayedPreviewFrameSrc,
    incomingPreviewFrameSrc,
    isIncomingPreviewVisible,
    displayedTimelineTime,
    hasPreviewOverlay,
    isSettledFrameVisible,
    scrubPreviewTimeRef,
    handleSetTime,
    handleScrubPreviewTimeChange,
    handleScrubActiveChange,
    handleScrubCommit,
    handleIncomingPreviewLoad,
    scheduleScrubDisplayTime,
    scheduleScrubSeek,
    resetPreviewFrames,
  };
}
