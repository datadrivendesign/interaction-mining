"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { extractVideoFrame } from "../../../edit/components/repair-screen/util/ios-video-operations";
import { TraceFormData, FrameData } from "../../../edit/components/types";
import { fetchVideoFile } from "../../utils/file-fetch";

export function useIOSReviewPlayback({
  captureDbId,
  traceData,
  setTraceData,
  activeScreenId,
  setActiveScreenId,
  isSubmitting,
}: {
  captureDbId: string | null;
  traceData: TraceFormData | undefined;
  setTraceData: Dispatch<SetStateAction<TraceFormData | undefined>>;
  activeScreenId: string | null;
  setActiveScreenId: Dispatch<SetStateAction<string | null>>;
  isSubmitting: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isProcessingRef = useRef(false);
  const rafRef = useRef<number>(0);
  const scrubRafRef = useRef<number | null>(null);
  const pendingScrubTimeRef = useRef<number | null>(null);
  const livePhotoEndRef = useRef<number | null>(null);
  const isProgrammaticSeekRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopReplayWindowIfNeeded = useCallback(
    (video: HTMLVideoElement, nextTime: number) => {
      const replayEnd = livePhotoEndRef.current;
      if (replayEnd !== null && nextTime >= replayEnd) {
        video.pause();
        livePhotoEndRef.current = null;
        return true;
      }

      return false;
    },
    [],
  );

  const populateDraftScreens = useCallback(
    async (video: HTMLVideoElement, screens: FrameData[]) => {
      const frames: FrameData[] = [];
      try {
        const screensCopy = screens.map((screen) => ({ ...screen }));
        await extractVideoFrame(video, 0.1);
        for (const screen of screensCopy) {
          if (!screen.src) {
            const frame = await extractVideoFrame(video, screen.timestamp);
            screen.src = frame.src;
          }
          frames.push(screen);
        }
      } catch (error) {
        console.error(`Error extracting video frames: ${error}`);
      }

      return frames;
    },
    [],
  );

  useEffect(() => {
    if (!captureDbId || !traceData) {
      return;
    }

    const loadVideoAndPopulateScreens = async () => {
      if (isProcessingRef.current) {
        return;
      }

      try {
        isProcessingRef.current = true;
        const videoFiles = await fetchVideoFile(`uploads/${captureDbId}`);
        if (videoFiles.length === 0 || !videoRef.current) {
          return;
        }

        const video = videoRef.current;
        video.src = videoFiles[0].fileUrl;
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video load timeout"));
          }, 30000);

          const onLoadedData = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("error", onError);
            resolve();
          };

          const onError = (event: Event) => {
            clearTimeout(timeout);
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("error", onError);
            reject(event);
          };

          video.addEventListener("loadeddata", onLoadedData, { once: true });
          video.addEventListener("error", onError, { once: true });
          if (video.readyState >= 2) {
            onLoadedData();
          }
        });

        if (traceData.screens.every((screen) => screen.src.length > 0)) {
          return;
        }

        const frames = await populateDraftScreens(video, traceData.screens);
        setTraceData((prevData) => {
          if (!prevData) {
            return prevData;
          }

          return {
            ...prevData,
            screens: frames.sort((a, b) => a.timestamp - b.timestamp),
          };
        });
      } catch (error) {
        console.error(`Error loading video: ${error}`);
      } finally {
        isProcessingRef.current = false;
      }
    };

    void loadVideoAndPopulateScreens();
  }, [captureDbId, populateDraftScreens, setTraceData, traceData]);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const syncCurrentTime = () => {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      const nextTime = video.currentTime;
      setCurrentTime(nextTime);

      if (stopReplayWindowIfNeeded(video, nextTime)) {
        return;
      }

      rafRef.current = requestAnimationFrame(syncCurrentTime);
    };

    rafRef.current = requestAnimationFrame(syncCurrentTime);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, stopReplayWindowIfNeeded]);

  useEffect(() => {
    return () => {
      if (scrubRafRef.current !== null) {
        cancelAnimationFrame(scrubRafRef.current);
      }
    };
  }, []);

  const sortedScreens = useMemo(
    () =>
      [...(traceData?.screens ?? [])].sort((a, b) => a.timestamp - b.timestamp),
    [traceData?.screens],
  );
  const activeScreen =
    sortedScreens.find((screen) => screen.id === activeScreenId) ??
    sortedScreens[0] ??
    null;
  const activeScreenIndex = activeScreen
    ? sortedScreens.findIndex((screen) => screen.id === activeScreen.id)
    : -1;

  const clearReplayWindow = useCallback(() => {
    livePhotoEndRef.current = null;
  }, []);

  const seekVideoToTime = useCallback(
    (timestamp: number, options?: { pause?: boolean }) => {
      const video = videoRef.current;
      if (!video) {
        return;
      }

      clearReplayWindow();
      const maxDuration = videoDuration > 0 ? videoDuration : timestamp;
      const clampedTimestamp = Math.max(0, Math.min(timestamp, maxDuration));

      if (options?.pause ?? true) {
        video.pause();
      }
      isProgrammaticSeekRef.current = true;
      video.currentTime = clampedTimestamp;
      setCurrentTime(clampedTimestamp);
    },
    [clearReplayWindow, videoDuration],
  );

  const handleScreenSelect = useCallback(
    (screenId: string, timestamp: number) => {
      setActiveScreenId(screenId);
      seekVideoToTime(timestamp);
    },
    [seekVideoToTime, setActiveScreenId],
  );

  const handleScreenStep = useCallback(
    (offset: number) => {
      if (sortedScreens.length === 0) {
        return;
      }

      const nextIndex =
        activeScreenIndex === -1
          ? 0
          : Math.max(
              0,
              Math.min(activeScreenIndex + offset, sortedScreens.length - 1),
            );
      const nextScreen = sortedScreens[nextIndex];
      if (!nextScreen) {
        return;
      }

      handleScreenSelect(nextScreen.id, nextScreen.timestamp);
    },
    [activeScreenIndex, handleScreenSelect, sortedScreens],
  );

  const getNearestScreenId = useCallback(
    (timestamp: number) => {
      if (sortedScreens.length === 0) {
        return null;
      }

      return sortedScreens.reduce((nearestScreen, candidateScreen) => {
        if (!nearestScreen) {
          return candidateScreen;
        }

        return Math.abs(candidateScreen.timestamp - timestamp) <
          Math.abs(nearestScreen.timestamp - timestamp)
          ? candidateScreen
          : nearestScreen;
      }, sortedScreens[0]).id;
    },
    [sortedScreens],
  );

  const commitScrubTime = useCallback(
    (timestamp: number) => {
      const nearestScreenId = getNearestScreenId(timestamp);
      if (nearestScreenId) {
        setActiveScreenId(nearestScreenId);
      }
      seekVideoToTime(timestamp);
    },
    [getNearestScreenId, seekVideoToTime, setActiveScreenId],
  );

  const handleMarkerStripScrub = useCallback(
    (timestamp: number) => {
      pendingScrubTimeRef.current = timestamp;

      if (scrubRafRef.current !== null) {
        return;
      }

      scrubRafRef.current = requestAnimationFrame(() => {
        scrubRafRef.current = null;
        const nextTimestamp = pendingScrubTimeRef.current;
        pendingScrubTimeRef.current = null;
        if (nextTimestamp === null) {
          return;
        }

        commitScrubTime(nextTimestamp);
      });
    },
    [commitScrubTime],
  );

  const replayScreenContext = useCallback(
    async (screenId: string, timestamp: number) => {
      const video = videoRef.current;
      if (!video || videoDuration <= 0) {
        return;
      }

      const replayStart = Math.max(0, timestamp - 1);
      const replayEnd = Math.min(videoDuration, timestamp + 1);

      setActiveScreenId(screenId);
      livePhotoEndRef.current = replayEnd;
      isProgrammaticSeekRef.current = true;
      video.currentTime = replayStart;
      setCurrentTime(replayStart);

      try {
        await video.play();
      } catch (error) {
        livePhotoEndRef.current = null;
        console.error(`Error replaying screen context: ${error}`);
      }
    },
    [setActiveScreenId, videoDuration],
  );

  const handleReplayActiveScreen = useCallback(async () => {
    if (!activeScreen) {
      return;
    }

    await replayScreenContext(activeScreen.id, activeScreen.timestamp);
  }, [activeScreen, replayScreenContext]);

  const handleVideoSeeking = useCallback(
    (video: HTMLVideoElement) => {
      if (isProgrammaticSeekRef.current) {
        isProgrammaticSeekRef.current = false;
        return;
      }

      clearReplayWindow();
      const nextTimestamp = video.currentTime;
      setCurrentTime(nextTimestamp);
      const nearestScreenId = getNearestScreenId(nextTimestamp);
      if (nearestScreenId) {
        setActiveScreenId(nearestScreenId);
      }
    },
    [clearReplayWindow, getNearestScreenId, setActiveScreenId],
  );

  const handleReplayScreen = useCallback(
    async (screenId: string) => {
      const targetScreen = sortedScreens.find((screen) => screen.id === screenId);
      if (!targetScreen) {
        return;
      }

      await replayScreenContext(targetScreen.id, targetScreen.timestamp);
    },
    [replayScreenContext, sortedScreens],
  );

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.src) {
      return;
    }

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  }, []);

  useHotkeys(
    "space",
    (event) => {
      event.preventDefault();
      togglePlayback();
    },
    {
      enabled: !isSubmitting && videoDuration > 0,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [isSubmitting, togglePlayback, videoDuration],
  );

  useHotkeys(
    "r",
    (event) => {
      event.preventDefault();
      void handleReplayActiveScreen();
    },
    {
      enabled: !isSubmitting && !!activeScreen && videoDuration > 0,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [activeScreen, handleReplayActiveScreen, isSubmitting, videoDuration],
  );

  return {
    videoRef,
    currentTime,
    videoDuration,
    isPlaying,
    sortedScreens,
    handleScreenSelect,
    handleScreenStep,
    handleMarkerStripScrub,
    handleReplayScreen,
    togglePlayback,
    stopReplayWindowIfNeeded,
    clearReplayWindow,
    handleVideoSeeking,
    handleOnVideoLoadedMetadata: (video: HTMLVideoElement) => {
      setVideoDuration(video.duration || 0);
    },
    handleOnVideoTimeUpdate: (video: HTMLVideoElement) => {
      const nextTime = video.currentTime;
      setCurrentTime(nextTime);
      stopReplayWindowIfNeeded(video, nextTime);
    },
    handleOnVideoPlay: () => setIsPlaying(true),
    handleOnVideoPause: () => {
      setIsPlaying(false);
      clearReplayWindow();
    },
  };
}
