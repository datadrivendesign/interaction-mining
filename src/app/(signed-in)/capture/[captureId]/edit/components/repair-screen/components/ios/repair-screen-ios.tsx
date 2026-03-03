import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Filmstrip } from "../filmstrip";
import FrameTimeline from "./extract-frames-timeline";
import { FocusViewIOS } from "./focus-view-ios";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { CirclePlay } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { extractThumbnails, extractVideoFrame } from "../../util";
import { toast } from "sonner";
import { FrameData, Redaction, TraceFormData } from "../../../types";
import { ListedFiles } from "@/lib/actions";
import { ScreenGesture } from "@prisma/client";
import { useFormContext, useWatch } from "react-hook-form";
import { useNavigation } from "../../repair-screen";
import { Platform } from "@/lib/utils";
import { InstructionCardIOS } from "../instruction-card";
import { DraftFetchResults } from "../../../../util";

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
  const { focusViewIndex } = useNavigation();
  const { setValue } = useFormContext<TraceFormData>();
  const [watchScreens, watchGestures, watchRedactions] = useWatch({
    name: ["screens", "gestures", "redactions"],
  });

  const screens = watchScreens as FrameData[];
  const gestures = watchGestures as { [key: string]: ScreenGesture };
  const redactions = watchRedactions as { [key: string]: Redaction[] };
  // video controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const isProcessingRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnails, setThumbnails] = useState<
    {
      src: string;
      timestamp: number;
      width: number;
      height: number;
    }[]
  >([]);
  // constants
  const MAX_THUMBS = 30;
  const THUMB_HEIGHT = 128;
  const frameStep = 1 / MAX_THUMBS;

  const videoFiles = useMemo(() => {
    const regexRule = /\.(mp4|mov)$/;
    // iOS screen recordings capitalize file extension, so we lowercase here
    return files.filter((f) => regexRule.test(f.fileKey.toLowerCase()));
  }, [files]);

  const populateDraftScreens = useCallback(
    async (video: HTMLVideoElement) => {
      const frames: FrameData[] = [];
      try {
        // Create a copy of screens to avoid mutation issues
        const screensCopy = screens.map((screen) => ({ ...screen }));

        // Before the loop, do a "warm-up" seek to ensure video is loaded:
        await extractVideoFrame(video, 0.1);
        for (const s of screensCopy) {
          if (!s.src) {
            const f = await extractVideoFrame(video, s.timestamp);
            s.src = f.src; // Safe to mutate the copy
          }
          frames.push(s);
        }
      } catch (error) {
        console.error(`Error extracting video frames: ${error}`);
      }
      return frames;
    },
    [screens]
  );

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
          THUMB_HEIGHT
        );
        setThumbnails(thumbs);
        const draftScreens = await populateDraftScreens(video);
        setValue(
          "screens",
          draftScreens.sort((a, b) => a.timestamp - b.timestamp)
        );
      } catch (e) {
        console.error("Error loading video blob:", e);
        toast.error("Error loading video for frame extraction");
      } finally {
        isProcessingRef.current = false;
      }
    };
    loadVideoAndPopulate();
  }, [videoFiles, videoRef, setValue, videoDuration, draftFetchResult]);

  // RAF to update currentTime
  useEffect(() => {
    // Start a loop to update currentTime on each animation frame while playing
    if (isPlaying) {
      const loop = () => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(rafRef.current);
      };
    }
  }, [isPlaying]);

  // Play/Pause toggle
  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? await video.play() : video.pause();
  };

  const handleSetTime = useCallback(
    (t: number) => {
      // Sanity check
      if (!Number.isFinite(t)) return;

      // Clamp to video duration
      if (t < 0) {
        t = 0;
      } else if (t > videoDuration) {
        t = videoDuration;
      }

      t = Math.max(0, Math.min(t, videoDuration));

      const video = videoRef.current;
      if (!video) return;
      video.pause();

      // video.fastSeek(t);
      video.currentTime = t;
      setCurrentTime(t);
    },
    [videoRef, videoDuration]
  );

  const handleCaptureFrame = async () => {
    if (!videoRef.current) return;
    const f = await extractVideoFrame(videoRef.current, currentTime);
    setValue(
      "screens",
      [...screens, f].sort((a, b) => a.timestamp - b.timestamp)
    );
  };

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
    "left",
    (e) => {
      e.preventDefault();
      handleSetTime(currentTime - 5);
    },
    [currentTime, handleSetTime]
  );

  useHotkeys(
    "j",
    (e) => {
      e.preventDefault();
      handleSetTime(currentTime - 5);
    },
    [currentTime, handleSetTime]
  );

  useHotkeys(
    "right",
    (e) => {
      e.preventDefault();
      handleSetTime(currentTime + 5);
    },
    [currentTime, handleSetTime]
  );

  useHotkeys(
    "l",
    (e) => {
      e.preventDefault();
      handleSetTime(currentTime + 5);
    },
    [currentTime, handleSetTime]
  );

  // Seek backward/forward by one frame
  useHotkeys(
    "comma",
    (e) => {
      e.preventDefault();
      handleSetTime(currentTime - frameStep);
    },
    [currentTime, handleSetTime]
  );

  useHotkeys(
    "period",
    (e) => {
      e.preventDefault();
      handleSetTime(currentTime + frameStep);
    },
    [currentTime, handleSetTime]
  );

  useHotkeys(
    "c",
    (e) => {
      e.preventDefault();
      handleCaptureFrame();
    },
    { keyup: true },
    [handleCaptureFrame]
  );

  return (
    <div className="flex flex-col w-full h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={67} minSize={50} maxSize={67}>
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
                <video
                  ref={videoRef}
                  crossOrigin="anonymous"
                  preload="auto"
                  className="max-w-full max-h-full rounded-lg object-contain"
                  controls={false}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={67} minSize={50} maxSize={67}>
              <InstructionCardIOS taskDescription={taskDescription} />
              {focusViewIndex > -1 && focusViewIndex < screens.length ? (
                <FocusViewIOS
                  key={focusViewIndex}
                  screen={screens[focusViewIndex]}
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
        <ResizablePanel defaultSize={30} minSize={30} maxSize={50}>
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
              currentTime={currentTime}
              videoDuration={videoDuration}
              isPlaying={isPlaying}
              handleSetTime={handleSetTime}
              handlePlayPause={handlePlayPause}
              handleCapture={handleCaptureFrame}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
