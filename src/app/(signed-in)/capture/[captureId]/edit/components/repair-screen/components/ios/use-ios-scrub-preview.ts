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
  PREVIEW_MATCH_TOLERANCE,
  PREVIEW_SWAP_DELAY_MS,
  PreviewThumbnail,
  SCRUB_SEEK_INTERVAL_MS,
  findNearestPreviewThumbnail,
} from "./ios-helpers";

interface UseIosScrubPreviewArgs {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoDuration: number;
  isPlaying: boolean;
  previewThumbnails: PreviewThumbnail[];
  currentTime: number;
  updateCurrentTime: (time: number) => void;
  livePhotoEndRef: MutableRefObject<number | null>;
  setIsLivePhotoActive: (active: boolean) => void;
  syncFocusToTimestamp: (time: number) => void;
}

export function useIosScrubPreview({
  videoRef,
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

  const getNearestPreviewThumbnail = useCallback(
    (time: number) => findNearestPreviewThumbnail(previewThumbnails, time),
    [previewThumbnails],
  );

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
      setIsPreviewNeeded((wasNeeded) => {
        if (wasNeeded) {
          return true;
        }
        const landed = lastCommittedVideoTimeRef.current;
        if (landed === null) {
          return true;
        }
        const thumbnail = getNearestPreviewThumbnail(time);
        if (!thumbnail) {
          return false;
        }
        return (
          Math.abs(thumbnail.timestamp - time) < Math.abs(landed - time)
        );
      });
    },
    [getNearestPreviewThumbnail],
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
        const hasCaughtUp =
          scrubQueuedSeekTimeRef.current === null &&
          scrubSeekTimeoutRef.current === null &&
          previewTarget !== null &&
          Math.abs(video.currentTime - previewTarget) <= PREVIEW_MATCH_TOLERANCE;

        if (hasCaughtUp) {
          setIsPreviewNeeded(false);
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
  }, [updateCurrentTime, videoRef]);

  // Cleanup all timers/RAFs on unmount.
  useEffect(() => {
    return () => {
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
  }, []);

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
  }, [activePreviewFrameSrc, displayedPreviewFrameSrc]);

  const handleIncomingPreviewLoad = useCallback((loadedSrc: string) => {
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
