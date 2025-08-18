import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Filmstrip } from "./filmstrip";
import FrameTimeline from "./extract-frames-timeline";
import { FocusView } from "./focus-view";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CirclePlay } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { extractThumbnails, extractVideoFrame } from "./util";
import { toast } from "sonner";
import { FrameData, Redaction, TraceFormData } from "../types";
import { ListedFiles } from "@/lib/actions";
import { ScreenGesture } from "@prisma/client";
import { useFormContext, useWatch } from "react-hook-form";
import { useNavigation } from "./repair-screen";
import { Platform } from "@/lib/utils";

export function RepairScreenIOS({
  capture,
  files,
  os,
}: {
  capture: any;
  files: ListedFiles[];
  os: Platform;
}) {
  const { focusViewIndex } = useNavigation();
  const { setValue } = useFormContext<TraceFormData>();
  const [watchScreens, watchVHs, watchGestures, watchRedactions] = useWatch({
    name: ["screens", "vhs", "gestures", "redactions"],
  });
  const screens = watchScreens as FrameData[];
  const vhs = watchVHs as { [key: string]: any };
  const gestures = watchGestures as { [key: string]: ScreenGesture };
  const redactions = watchRedactions as { [key: string]: Redaction[] };
  // video controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
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

  const populateDraftScreens = useCallback(
    async (video: HTMLVideoElement) => {
      const frames: FrameData[] = [];
      for (const s of screens) {
        if (!s.src) {
          const f = await extractVideoFrame(video, s.timestamp);
          s.src = f.src;
        }
        frames.push(s);
      }
      return frames;
    },
    [screens]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoDuration === 0) {
      return;
    }
    // manually load and extract thumbnails
    extractThumbnails(video, videoDuration, MAX_THUMBS, THUMB_HEIGHT).then(
      (thumbs) => {
        setThumbnails(thumbs);
      }
    );
    // set src field for screens for those not set
    populateDraftScreens(video).then((frames) => {
      setValue(
        "screens",
        frames.sort((a, b) => a.timestamp - b.timestamp)
      );
    });
    // adding screens to dependency array can cause infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, videoDuration, setValue]);

  const videoFiles = useMemo(() => {
    const regexRule = /\.(mp4|mov)$/;
    // iOS screen recordings capitalize file extension, so we lowercase here
    return files.filter((f) => regexRule.test(f.fileKey.toLowerCase()));
  }, [files]);

  useEffect(() => {
    const loadVideoBlob = async () => {
      if (videoFiles.length > 0 && videoRef.current) {
        try {
          const response = await fetch(videoFiles[0].fileUrl);
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          videoRef.current.src = objectUrl;
        } catch (e) {
          console.error("Error loading video blob:", e);
          toast.error("Error loading video for frame extraction");
        }
      }
    };
    loadVideoBlob();
  }, [videoFiles]);

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
                  "left-4 absolute top-0 w-20 h-20 p-0 z-10 shadow-md bg-background border rounded-md"
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
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    setVideoDuration(video.duration);
                  }}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={67} minSize={50} maxSize={67}>
              <Card
                key="task"
                className={
                  "right-4 absolute top-0 w-60 h-60 p-0 z-10 shadow-md bg-background border rounded-md"
                }
              >
                <CardHeader className="flex flex-col items-center p-2">
                  <CardDescription>
                    <Badge>
                      <article className="prose prose-neutral dark:prose-invert leading-snug text-sm font-semibold text-white dark:text-neutral-900 w-full whitespace-pre-wrap">
                        <p>
                          Task:{" "}
                          <span className="text-xs">
                            {capture?.task?.description ?? "No task provided."}
                          </span>
                        </p>
                      </article>
                    </Badge>
                    <p className="mt-1 text-xs font-semibold">
                      1. Capture screens from video.
                    </p>
                    <p className="text-xs font-semibold">
                      2. Add gestures to screens
                    </p>
                    <p className="text-xs">
                      <strong>Add screen gestures on this side.</strong> Start
                      gesture description with a verb, no full sentences.
                    </p>
                    {capture?.feedback && capture?.feedback !== "" && (
                      <div className="text-sm mt-3">
                        <strong>Feedback:</strong>
                        <p className="text-xs">
                          {capture?.feedback ?? "No feedback provided."}
                        </p>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
              {focusViewIndex > -1 && focusViewIndex < screens.length ? (
                <FocusView
                  key={focusViewIndex}
                  vh={vhs[screens[focusViewIndex].id]}
                  screen={screens[focusViewIndex]}
                  isLastScreen={focusViewIndex === screens.length - 1}
                  os={os}
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
        <ResizablePanel defaultSize={33} minSize={33} maxSize={50}>
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
