import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Filmstrip } from "../filmstrip";
import FrameTimeline from "./extract-frames-timeline";
import { FocusViewIOS } from "./focus-view-ios";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Aperture, CirclePlay } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { extractThumbnails, extractVideoFrame } from "../../util";
import { toast } from "sonner";
import { FrameData, Redaction, TraceFormData } from "../../../types";
import { ListedFiles } from "@/lib/actions";
import { ScreenGesture } from "@prisma/client";
import { useFormContext, useWatch } from "react-hook-form";
import { useNavigation } from "../../repair-screen";
import { cn, Platform } from "@/lib/utils";
import { DraftFetchResults } from "../../../../util";
import { InstructionCardIOS } from "../instruction-card";

export function RepairScreenIOS({
  taskDescription,
  files,
  os,
  draftFetchResult,
}: {
  taskDescription: string | undefined;
  files: ListedFiles[];
  os: Platform;
  draftFetchResult: DraftFetchResults;
}) {
  const { focusViewIndex, setFocusViewIndex } = useNavigation();
  const { setValue } = useFormContext<TraceFormData>();
  const [watchScreens, watchGestures, watchRedactions] = useWatch({
    name: ["screens", "gestures", "redactions"],
  });

  const screens = watchScreens as FrameData[];
  const gestures = watchGestures as { [key: string]: ScreenGesture };
  const redactions = watchRedactions as { [key: string]: Redaction[] };
  const focusedScreen =
    focusViewIndex > -1 && focusViewIndex < screens.length
      ? screens[focusViewIndex]
      : null;
  const captureMarkers = useMemo(
    () =>
      screens.map((screen, index) => ({
        id: screen.id,
        timestamp: screen.timestamp,
        isFocused: focusViewIndex === index,
      })),
    [focusViewIndex, screens],
  );
  // video controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const screensRef = useRef<FrameData[]>(screens);
  const screenObjectUrlsRef = useRef<Set<string>>(new Set());
  const thumbnailObjectUrlsRef = useRef<string[]>([]);
  const previewThumbnailObjectUrlsRef = useRef<string[]>([]);
  const rafRef = useRef<number>(0);
  const isProcessingRef = useRef(false);
  const pendingSeekTimeRef = useRef<number | null>(null);
  const isSeekInFlightRef = useRef(false);
  const scrubPreviewTimeRef = useRef<number | null>(null);
  const isScrubPreviewActiveRef = useRef(false);
  const scrubQueuedSeekTimeRef = useRef<number | null>(null);
  const scrubSeekTimeoutRef = useRef<number | null>(null);
  const lastScrubSeekAtRef = useRef(0);
  const pendingScrubDisplayTimeRef = useRef<number | null>(null);
  const scrubDisplayRafRef = useRef<number | null>(null);
  const stepCommitTimeoutRef = useRef<number | null>(null);
  const steppedTargetTimeRef = useRef<number | null>(null);
  const previewSwapTimeoutRef = useRef<number | null>(null);
  const lastCommittedVideoTimeRef = useRef<number | null>(null);
  const currentTimeRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubPreviewActive, setIsScrubPreviewActive] = useState(false);
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);
  const [pausedPreviewTime, setPausedPreviewTime] = useState<number | null>(
    null,
  );
  // Live photo: replay ±1s around a screen's timestamp in the video player
  const livePhotoEndRef = useRef<number | null>(null);
  const [isLivePhotoActive, setIsLivePhotoActive] = useState(false);
  const [thumbnails, setThumbnails] = useState<
    {
      src: string;
      timestamp: number;
      width: number;
      height: number;
    }[]
  >([]);
  const [previewThumbnails, setPreviewThumbnails] = useState<
    {
      src: string;
      timestamp: number;
      width: number;
      height: number;
    }[]
  >([]);
  const [displayedPreviewFrameSrc, setDisplayedPreviewFrameSrc] = useState<
    string | null
  >(null);
  const [incomingPreviewFrameSrc, setIncomingPreviewFrameSrc] = useState<
    string | null
  >(null);
  const [isIncomingPreviewVisible, setIsIncomingPreviewVisible] =
    useState(false);
  // constants
  const MAX_THUMBS = 35;
  const THUMB_HEIGHT = 128;
  const PREVIEW_THUMB_HEIGHT = 1440;
  const THUMBNAIL_JPEG_QUALITY = 0.84;
  const PREVIEW_JPEG_QUALITY = 0.9;
  const SCRUB_SEEK_INTERVAL_MS = 125;
  const frameStep = 1 / 30;

  const videoFiles = useMemo(() => {
    const regexRule = /\.(mp4|mov)$/;
    // iOS screen recordings capitalize file extension, so we lowercase here
    return files.filter((f) => regexRule.test(f.fileKey.toLowerCase()));
  }, [files]);

  const getNearestScreenIndex = useCallback(
    (time: number) => {
      if (!Number.isFinite(time) || screens.length === 0) {
        return -1;
      }

      let nearestIndex = 0;
      let nearestDelta = Math.abs(screens[0].timestamp - time);

      for (let index = 1; index < screens.length; index += 1) {
        const delta = Math.abs(screens[index].timestamp - time);
        if (delta < nearestDelta) {
          nearestIndex = index;
          nearestDelta = delta;
        }
      }

      return nearestIndex;
    },
    [screens],
  );

  const syncFocusToTimestamp = useCallback(
    (time: number) => {
      const nextIndex = getNearestScreenIndex(time);
      if (nextIndex >= 0 && nextIndex !== focusViewIndex) {
        setFocusViewIndex(nextIndex);
      }
    },
    [focusViewIndex, getNearestScreenIndex, setFocusViewIndex],
  );

  const getNearestPreviewThumbnail = useCallback(
    (time: number) => {
      if (previewThumbnails.length === 0) {
        return null;
      }

      return previewThumbnails.reduce((closest, thumbnail) =>
        Math.abs(thumbnail.timestamp - time) <
        Math.abs(closest.timestamp - time)
          ? thumbnail
          : closest,
      );
    },
    [previewThumbnails],
  );

  const activePreviewFrameSrc = useMemo(() => {
    if (scrubPreviewTime !== null) {
      return getNearestPreviewThumbnail(scrubPreviewTime)?.src ?? null;
    }

    if (pausedPreviewTime !== null) {
      const previewTime = pausedPreviewTime;
      return getNearestPreviewThumbnail(previewTime)?.src ?? null;
    }

    return null;
  }, [
    getNearestPreviewThumbnail,
    pausedPreviewTime,
    scrubPreviewTime,
  ]);

  const updateCurrentTime = useCallback((time: number) => {
    currentTimeRef.current = time;
    setCurrentTime(time);
  }, []);

  const revokeObjectUrls = useCallback((urls: string[]) => {
    for (const url of urls) {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    }
  }, []);

  const trackScreenObjectUrl = useCallback((src: string) => {
    if (src.startsWith("blob:")) {
      screenObjectUrlsRef.current.add(src);
    }
  }, []);

  const revokeAllTrackedObjectUrls = useCallback(() => {
    revokeObjectUrls(thumbnailObjectUrlsRef.current);
    revokeObjectUrls(previewThumbnailObjectUrlsRef.current);
    revokeObjectUrls(Array.from(screenObjectUrlsRef.current));
  }, [revokeObjectUrls]);

  const displayedTimelineTime = scrubPreviewTime ?? currentTime;
  const hasPreviewOverlay =
    displayedPreviewFrameSrc !== null || incomingPreviewFrameSrc !== null;

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
      steppedTargetTimeRef.current = null;
      if (stepCommitTimeoutRef.current !== null) {
        window.clearTimeout(stepCommitTimeoutRef.current);
        stepCommitTimeoutRef.current = null;
      }
      setIsScrubPreviewActive(false);
      scrubPreviewTimeRef.current = null;
      setScrubPreviewTime(null);
      setPausedPreviewTime(null);
      setDisplayedPreviewFrameSrc(null);
      setIncomingPreviewFrameSrc(null);
      setIsIncomingPreviewVisible(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    screensRef.current = screens;

    const activeBlobScreenSrcs = new Set(
      screens
        .map((screen) => screen.src)
        .filter((src) => typeof src === "string" && src.startsWith("blob:")),
    );

    for (const url of Array.from(screenObjectUrlsRef.current)) {
      if (!activeBlobScreenSrcs.has(url)) {
        URL.revokeObjectURL(url);
        screenObjectUrlsRef.current.delete(url);
      }
    }
  }, [screens]);

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
        const scrubTargetTime = scrubPreviewTimeRef.current;
        if (
          scrubTargetTime !== null &&
          Math.abs(video.currentTime - scrubTargetTime) <= 0.001
        ) {
          scrubPreviewTimeRef.current = null;
          setScrubPreviewTime(null);
        }

        if (
          scrubPreviewTimeRef.current === null &&
          (lastCommittedVideoTime === null ||
            Math.abs(lastCommittedVideoTime - video.currentTime) > 0.001)
        ) {
          lastCommittedVideoTimeRef.current = video.currentTime;
          updateCurrentTime(video.currentTime);
        }
      });
    };
    video.addEventListener("seeked", syncSeekTime);
    return () => {
      video.removeEventListener("seeked", syncSeekTime);
    };
  }, [updateCurrentTime]);

  useEffect(() => {
    return () => {
      if (scrubSeekTimeoutRef.current !== null) {
        window.clearTimeout(scrubSeekTimeoutRef.current);
      }
      if (stepCommitTimeoutRef.current !== null) {
        window.clearTimeout(stepCommitTimeoutRef.current);
      }
      if (scrubDisplayRafRef.current !== null) {
        cancelAnimationFrame(scrubDisplayRafRef.current);
      }
      if (previewSwapTimeoutRef.current !== null) {
        window.clearTimeout(previewSwapTimeoutRef.current);
      }
      revokeAllTrackedObjectUrls();
    };
  }, [revokeAllTrackedObjectUrls]);

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
    setIsIncomingPreviewVisible(true);

    if (previewSwapTimeoutRef.current !== null) {
      window.clearTimeout(previewSwapTimeoutRef.current);
    }

    previewSwapTimeoutRef.current = window.setTimeout(() => {
      setDisplayedPreviewFrameSrc(loadedSrc);
      setIncomingPreviewFrameSrc((currentIncomingSrc) =>
        currentIncomingSrc === loadedSrc ? null : currentIncomingSrc,
      );
      setIsIncomingPreviewVisible(false);
      previewSwapTimeoutRef.current = null;
    }, 70);
  }, []);

  useEffect(() => {
    const loadVideoAndPopulate = async () => {
      if (isProcessingRef.current) {
        // video is already being processed
        return;
      }
      if (videoFiles.length === 0 || !videoRef.current) {
        // video files not found or video ref not found
        return;
      }
      if (draftFetchResult === DraftFetchResults.LOADING) {
        return;
      }
      try {
        isProcessingRef.current = true;
        revokeObjectUrls(thumbnailObjectUrlsRef.current);
        revokeObjectUrls(previewThumbnailObjectUrlsRef.current);
        thumbnailObjectUrlsRef.current = [];
        previewThumbnailObjectUrlsRef.current = [];
        setThumbnails([]);
        setPreviewThumbnails([]);
        setDisplayedPreviewFrameSrc(null);
        setIncomingPreviewFrameSrc(null);
        setIsIncomingPreviewVisible(false);
        const video = videoRef.current;
        video.src = videoFiles[0].fileUrl;
        // wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video load timeout"));
          }, 30000); // 30 second timeout

          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            setVideoDuration(video.duration);
            resolve();
          };

          const onError = (e: any) => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            reject(e);
          };

          video.addEventListener("loadedmetadata", onLoadedMetadata, {
            once: true,
          });
          video.addEventListener("error", onError, { once: true });
          // Check if already loaded
          if (video.readyState >= 2 && video.duration > 0) {
            onLoadedMetadata();
          }
        });
        // Now videoDuration should be set, but double-check
        if (video.duration === 0) {
          throw new Error("Video duration not available");
        }
        const thumbs = await extractThumbnails(
          video,
          video.duration,
          MAX_THUMBS,
          THUMB_HEIGHT,
          {
            mimeType: "image/jpeg",
            quality: THUMBNAIL_JPEG_QUALITY,
            output: "object-url",
            preferOffscreenCanvas: true,
          },
        );
        thumbnailObjectUrlsRef.current = thumbs
          .map((thumb) => thumb.src)
          .filter((src) => src.startsWith("blob:"));
        setThumbnails(thumbs);
        const largePreviewThumbs = await extractThumbnails(
          video,
          video.duration,
          Math.min(90, Math.max(52, Math.ceil(video.duration))),
          PREVIEW_THUMB_HEIGHT,
          {
            mimeType: "image/jpeg",
            quality: PREVIEW_JPEG_QUALITY,
            output: "object-url",
            preferOffscreenCanvas: true,
          },
        );
        previewThumbnailObjectUrlsRef.current = largePreviewThumbs
          .map((thumb) => thumb.src)
          .filter((src) => src.startsWith("blob:"));
        setPreviewThumbnails(largePreviewThumbs);
        const screensSnapshot = screensRef.current.map((screen) => ({
          ...screen,
        }));
        const draftScreens: FrameData[] = [];

        try {
          // Warm the video decoder once before extracting any missing frames.
          const warmupFrame = await extractVideoFrame(video, 0.1, {
            mimeType: "image/png",
            output: "object-url",
            preferOffscreenCanvas: true,
          });
          if (warmupFrame.src.startsWith("blob:")) {
            URL.revokeObjectURL(warmupFrame.src);
          }
          for (const screen of screensSnapshot) {
            if (!screen.src) {
              const frame = await extractVideoFrame(video, screen.timestamp, {
                mimeType: "image/png",
                output: "object-url",
                preferOffscreenCanvas: true,
              });
              screen.src = frame.src;
              trackScreenObjectUrl(frame.src);
            }
            draftScreens.push(screen);
          }
        } catch (error) {
          console.error(`Error extracting video frames: ${error}`);
        }

        setValue(
          "screens",
          draftScreens.sort((a, b) => a.timestamp - b.timestamp),
        );
      } catch (e) {
        console.error("Error loading video blob:", e);
        toast.error("Error loading video for frame extraction");
      } finally {
        isProcessingRef.current = false;
      }
    };
    loadVideoAndPopulate();
  }, [
    MAX_THUMBS,
    PREVIEW_JPEG_QUALITY,
    PREVIEW_THUMB_HEIGHT,
    THUMBNAIL_JPEG_QUALITY,
    THUMB_HEIGHT,
    draftFetchResult,
    revokeObjectUrls,
    setValue,
    trackScreenObjectUrl,
    videoFiles,
  ]);

  // RAF to update currentTime
  useEffect(() => {
    // Start a loop to update currentTime on each animation frame while playing
    if (isPlaying) {
      const loop = () => {
        if (videoRef.current) {
          const t = videoRef.current.currentTime;
          updateCurrentTime(t);

          // Auto-stop for live photo playback
          const endTime = livePhotoEndRef.current;
          if (endTime !== null && t >= endTime) {
            videoRef.current.pause();
            livePhotoEndRef.current = null;
            setIsLivePhotoActive(false);
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(rafRef.current);
      };
    }
  }, [isPlaying, updateCurrentTime]);

  // Play/Pause toggle
  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;
    // Cancel any active live photo auto-stop on manual toggle
    livePhotoEndRef.current = null;
    setIsLivePhotoActive(false);
    video.paused ? await video.play() : video.pause();
  };

  const handleSetTime = useCallback(
    (t: number, options?: { syncFocus?: boolean }) => {
      // Sanity check
      if (!Number.isFinite(t)) return;

      // Cancel any active live photo auto-stop on manual seek
      livePhotoEndRef.current = null;
      setIsLivePhotoActive(false);

      // Clamp to video duration
      if (t < 0) {
        t = 0;
      } else if (t > videoDuration) {
        t = videoDuration;
      }

      t = Math.max(0, Math.min(t, videoDuration));

      if (options?.syncFocus ?? true) {
        syncFocusToTimestamp(t);
      }

      const video = videoRef.current;
      if (!video) return;
      video.pause();
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
    [syncFocusToTimestamp, updateCurrentTime, videoDuration],
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
    [SCRUB_SEEK_INTERVAL_MS, handleSetTime],
  );

  const flushScrubDisplayTime = useCallback(() => {
    scrubDisplayRafRef.current = null;
    const nextTime = pendingScrubDisplayTimeRef.current;
    scrubPreviewTimeRef.current = nextTime;
    setScrubPreviewTime(nextTime);

    if (nextTime === null || !isScrubPreviewActiveRef.current) {
      return;
    }

    scheduleScrubSeek(nextTime, false, false);
  }, [scheduleScrubSeek]);

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
    setIsScrubPreviewActive(active);

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

  const handleCaptureFrame = async () => {
    if (!videoRef.current) return;
    const f = await extractVideoFrame(videoRef.current, currentTime, {
      mimeType: "image/png",
      output: "object-url",
      preferOffscreenCanvas: true,
    });
    trackScreenObjectUrl(f.src);
    setValue(
      "screens",
      [...screens, f].sort((a, b) => a.timestamp - b.timestamp),
    );
  };

  // Live photo: seek to timestamp-1s and play for 2s in the left-panel video
  const handleLivePhoto = useCallback(
    async (timestamp: number) => {
      const video = videoRef.current;
      if (!video || videoDuration <= 0) return;

      const startTime = Math.max(0, timestamp - 1);
      const endTime = Math.min(videoDuration, timestamp + 1);

      livePhotoEndRef.current = endTime;
      setIsLivePhotoActive(true);
      setPausedPreviewTime(null);

      video.currentTime = startTime;
      updateCurrentTime(startTime);
      await video.play();
    },
    [updateCurrentTime, videoDuration],
  );

  // Cancel live photo on screen navigation
  useEffect(() => {
    livePhotoEndRef.current = null;
    setIsLivePhotoActive(false);
  }, [focusViewIndex]);

  // Workspace keybinds
  useHotkeys("space", async (e) => {
    e.preventDefault();
    await handlePlayPause();
  });

  useHotkeys("k", async (e) => {
    e.preventDefault();
    await handlePlayPause();
  });

  useHotkeys(
    "r",
    (e) => {
      e.preventDefault();
      if (focusViewIndex < 0 || focusViewIndex >= screens.length) return;
      handleLivePhoto(screens[focusViewIndex].timestamp);
    },
    [focusViewIndex, screens, handleLivePhoto],
  );

  useHotkeys(
    "j",
    (e) => {
      e.preventDefault();
      handleSetTime(currentTime - 5);
    },
    [currentTime, handleSetTime],
  );

  useHotkeys(
    "l",
    (e) => {
      e.preventDefault();
      handleSetTime(currentTime + 5);
    },
    [currentTime, handleSetTime],
  );

  useEffect(() => {
    const flushSteppedTarget = () => {
      if (steppedTargetTimeRef.current === null) {
        return;
      }
      const targetTime = steppedTargetTimeRef.current;
      steppedTargetTimeRef.current = null;
      handleScrubCommit(targetTime);
    };

    const scheduleStepCommit = () => {
      if (stepCommitTimeoutRef.current !== null) {
        window.clearTimeout(stepCommitTimeoutRef.current);
      }
      stepCommitTimeoutRef.current = window.setTimeout(() => {
        stepCommitTimeoutRef.current = null;
        flushSteppedTarget();
      }, 120);
    };

    const handleFrameStepKeydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key !== "," && event.key !== ".") {
        return;
      }

      event.preventDefault();
      const delta = event.key === "," ? -frameStep : frameStep;
      const baseTime =
        steppedTargetTimeRef.current ?? scrubPreviewTimeRef.current ?? currentTimeRef.current;
      const nextTime = Math.max(
        0,
        Math.min(baseTime + delta, videoDuration),
      );

      steppedTargetTimeRef.current = nextTime;
      scheduleScrubDisplayTime(nextTime, true);
      setPausedPreviewTime(nextTime);
      scheduleScrubSeek(nextTime, false, true);
      scheduleStepCommit();
    };

    const handleFrameStepKeyup = (event: KeyboardEvent) => {
      if (event.key !== "," && event.key !== ".") {
        return;
      }
      event.preventDefault();
      if (stepCommitTimeoutRef.current !== null) {
        window.clearTimeout(stepCommitTimeoutRef.current);
        stepCommitTimeoutRef.current = null;
      }
      flushSteppedTarget();
    };

    window.addEventListener("keydown", handleFrameStepKeydown);
    window.addEventListener("keyup", handleFrameStepKeyup);
    return () => {
      window.removeEventListener("keydown", handleFrameStepKeydown);
      window.removeEventListener("keyup", handleFrameStepKeyup);
    };
  }, [
    frameStep,
    handleScrubCommit,
    scheduleScrubDisplayTime,
    scheduleScrubSeek,
    videoDuration,
  ]);

  useHotkeys(
    "c",
    (e) => {
      e.preventDefault();
      handleCaptureFrame();
    },
    { keyup: true },
    [handleCaptureFrame],
  );

  return (
    <div className="flex flex-col w-full h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel
          defaultSize={67}
          minSize={50}
          maxSize={67}
          className="relative z-20 overflow-visible"
        >
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
              defaultSize={33}
              minSize={33}
              maxSize={50}
              className="flex flex-col justify-center items-center h-full min-h-0 p-4 md:p-6 bg-neutral-50 dark:bg-neutral-950 box-border"
            >
              <Card
                key="video"
                className={
                  "hidden lg:block left-4 absolute top-0 w-20 h-20 p-0 z-10 shadow-md bg-background border rounded-md"
                }
              >
                <CardHeader className="flex flex-col items-center p-2">
                  <CardDescription>
                    <CirclePlay className="size-10" />
                    <p className="text-sm font-semibold">
                      <strong>Video</strong>
                    </p>
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="flex flex-col justify-center items-center w-full h-full gap-4">
                <div className="relative flex justify-center items-center w-full h-full">
                  <video
                    ref={videoRef}
                    crossOrigin="anonymous"
                    preload="auto"
                    className={cn(
                      "max-w-full max-h-full rounded-lg object-contain transition-opacity",
                      hasPreviewOverlay ? "opacity-0" : "opacity-100",
                    )}
                    controls={false}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  {displayedPreviewFrameSrc ? (
                    <Image
                      src={displayedPreviewFrameSrc}
                      alt="Scrub preview"
                      fill
                      unoptimized
                      sizes="100vw"
                      className="pointer-events-none absolute inset-0 h-full w-full rounded-lg object-contain"
                    />
                  ) : null}
                  {incomingPreviewFrameSrc ? (
                    <Image
                      key={incomingPreviewFrameSrc}
                      src={incomingPreviewFrameSrc}
                      alt="Incoming scrub preview"
                      fill
                      unoptimized
                      sizes="100vw"
                      onLoad={() =>
                        handleIncomingPreviewLoad(incomingPreviewFrameSrc)
                      }
                      className={cn(
                        "pointer-events-none absolute inset-0 h-full w-full rounded-lg object-contain transition-opacity duration-75",
                        isIncomingPreviewVisible ? "opacity-100" : "opacity-0",
                      )}
                    />
                  ) : null}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={67}
              minSize={50}
              maxSize={67}
              className="relative overflow-visible"
            >
              <div className="pointer-events-none absolute top-3 left-3 z-40 flex max-w-[11rem] flex-col items-start gap-2 lg:max-w-[11rem]">
                {focusedScreen ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      "pointer-events-auto rounded-full bg-background/80 backdrop-blur-sm shadow-sm border",
                      isLivePhotoActive && "text-amber-500 animate-pulse",
                    )}
                    onClick={() => handleLivePhoto(focusedScreen.timestamp)}
                    tooltip="Replay ±1s around this frame"
                  >
                    <Aperture className="size-4" />
                  </Button>
                ) : null}
                <InstructionCardIOS taskDescription={taskDescription} />
              </div>
              {focusedScreen ? (
                <FocusViewIOS
                  key={focusedScreen.id}
                  screen={focusedScreen}
                  isLastScreen={focusViewIndex === screens.length - 1}
                />
              ) : (
                <div className="flex justify-center items-center w-full h-full">
                  <span className="text-3xl lg:text-4xl text-muted-foreground font-semibold">
                    Select a screen from the capture filmstrip.
                  </span>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />
        <ResizablePanel
          defaultSize={30}
          minSize={30}
          maxSize={50}
          className="relative z-10"
        >
          <div className="flex flex-col h-full">
            <Filmstrip
              screens={screens}
              gestures={gestures}
              redactions={redactions}
              os={os}
              handleSetTime={handleSetTime}
            />
            <FrameTimeline
              thumbnails={thumbnails}
              currentTime={displayedTimelineTime}
              videoDuration={videoDuration}
              isPlaying={isPlaying}
              captureMarkers={captureMarkers}
              handleSetTime={handleSetTime}
              handlePlayPause={handlePlayPause}
              handleCapture={handleCaptureFrame}
              onScrubPreviewTimeChange={handleScrubPreviewTimeChange}
              onScrubActiveChange={handleScrubActiveChange}
              onScrubCommit={handleScrubCommit}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
