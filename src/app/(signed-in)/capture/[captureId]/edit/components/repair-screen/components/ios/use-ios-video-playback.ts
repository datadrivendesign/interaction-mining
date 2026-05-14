import { RefObject, useCallback, useEffect, useRef, useState } from "react";

interface UseIosVideoPlaybackArgs {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoDuration: number;
  focusViewIndex: number;
  onLivePhotoStart?: () => void;
}

export function useIosVideoPlayback({
  videoRef,
  videoDuration,
  focusViewIndex,
  onLivePhotoStart,
}: UseIosVideoPlaybackArgs) {
  const rafRef = useRef<number>(0);
  const currentTimeRef = useRef(0);
  const livePhotoEndRef = useRef<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLivePhotoActive, setIsLivePhotoActive] = useState(false);

  const updateCurrentTime = useCallback((time: number) => {
    currentTimeRef.current = time;
    setCurrentTime(time);
  }, []);

  // RAF loop while playing to keep currentTime in sync and auto-stop live photo.
  useEffect(() => {
    if (!isPlaying) return;

    const loop = () => {
      if (videoRef.current) {
        const t = videoRef.current.currentTime;
        updateCurrentTime(t);

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
  }, [isPlaying, updateCurrentTime, videoRef]);

  // Cancel live photo on screen navigation.
  useEffect(() => {
    livePhotoEndRef.current = null;
    setIsLivePhotoActive(false);
  }, [focusViewIndex]);

  const handlePlayPause = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    livePhotoEndRef.current = null;
    setIsLivePhotoActive(false);
    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  }, [videoRef]);

  const handleLivePhoto = useCallback(
    async (timestamp: number) => {
      const video = videoRef.current;
      if (!video || videoDuration <= 0) return;

      const startTime = Math.max(0, timestamp - 1);
      const endTime = Math.min(videoDuration, timestamp + 1);

      livePhotoEndRef.current = endTime;
      setIsLivePhotoActive(true);
      onLivePhotoStart?.();

      video.currentTime = startTime;
      updateCurrentTime(startTime);
      await video.play();
    },
    [onLivePhotoStart, updateCurrentTime, videoDuration, videoRef],
  );

  return {
    currentTime,
    currentTimeRef,
    isPlaying,
    setIsPlaying,
    isLivePhotoActive,
    setIsLivePhotoActive,
    livePhotoEndRef,
    updateCurrentTime,
    handlePlayPause,
    handleLivePhoto,
  };
}
