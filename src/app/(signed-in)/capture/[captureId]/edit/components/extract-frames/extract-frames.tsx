"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import throttle from "lodash/throttle";
import useSWR from "swr";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ListRestart } from "lucide-react";
import { FrameGalleryAndroid, FrameGalleryIOS } from "./extract-frames-gallery";
import { TraceFormData } from "../types";

import { ScreenGesture } from "@prisma/client";
import { ListedFiles, CaptureScreenFile } from "@/lib/actions";
import { FrameData } from "../types";
import FrameTimeline from "./extract-frames-timeline";
import { extractVideoFrame } from "./utils";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useHotkeys } from "react-hotkeys-hook";
import { listFromS3 } from "@/lib/aws";

export async function fileFetcher([_, fileKey]: [string, string]) {
  let res = await listFromS3(fileKey);

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch uploaded files", res.message);
    toast.error("Failed to fetch uploaded files");
    return [];
  }
}

export default function ExportFrames({ capture }: { capture: any }) {
  return (
    <>
      {(capture.task.os as string).toLowerCase() === "android" ? (
        <ExtractFramesAndroid capture={capture} />
      ) : (
        <ExtractFramesIOS capture={capture} />
      )}
    </>
  );
}

const ExtractFramesAndroid = ({ capture }: { capture: any }) => {
  const { setValue } = useFormContext<TraceFormData>();
  const [watchScreens, watchVHs, watchGestures] = useWatch({
    name: ["screens", "vhs", "gestures"],
  });
  const originalFrames = useRef<FrameData[]>([]);
  const originalVHs = useRef<{ [key: string]: any }>({});
  const originalGestures = useRef<{ [key: string]: ScreenGesture }>({});
  const currFrames = watchScreens as FrameData[];
  const currVHs = watchVHs as { [key: string]: any };
  const currGestures = watchGestures as { [key: string]: ScreenGesture };

  // Fetch file data
  const { data: files = [], isLoading: isFilesLoading } = useSWR(
    capture.id ? ["Capture files", `processed/${capture.id}`] : null,
    fileFetcher
  );

  useEffect(() => {
    const populateFrameData = async (
      files: ListedFiles[]
    ): Promise<{
      frames: FrameData[];
      vhs: { [key: string]: any };
      gestures: { [key: string]: ScreenGesture };
    }> => {
      function createScreenGesture(gesture: ScreenGesture): ScreenGesture {
        const { x, y, scrollDeltaX, scrollDeltaY, type } = gesture;
        const screenGesture: ScreenGesture = {
          type: type,
          x,
          y,
          scrollDeltaX,
          scrollDeltaY,
          description: "",
        };
        if (!type) {
          screenGesture.type = "other";
        } else if (type === "TYPE_VIEW_CLICKED") {
          screenGesture.type = "Tap";
        } else if (type === "TYPE_VIEW_LONG_CLICKED") {
          screenGesture.type = "Touch and hold";
        } else if (type === "TYPE_VIEW_SCROLLED") {
          // get directionality of scroll/swipe,choose dominant delta direction
          if (scrollDeltaX! > 0 && scrollDeltaX! > scrollDeltaY!) {
            screenGesture.type = "Swipe right";
          } else if (scrollDeltaX! < 0 && scrollDeltaX! < scrollDeltaY!) {
            screenGesture.type = "Swipe left";
          } else if (scrollDeltaY! > 0 && scrollDeltaY! > scrollDeltaX!) {
            screenGesture.type = "Swipe up";
          } else if (scrollDeltaY! < 0 && scrollDeltaY! < scrollDeltaX!) {
            screenGesture.type = "Swipe down";
          } else {
            // fall through case, don't know what will reach
            screenGesture.type = "Swipe";
          }
        } else {
          screenGesture.type = "other";
        }
        return screenGesture;
      }

      const frameData: FrameData[] = [];
      const frameVHs: { [key: string]: any } = {};
      const frameGestures: { [key: string]: ScreenGesture } = {};
      for (const [i, c] of files.entries()) {
        try {
          const frameResponse = await fetch(c.fileUrl);
          const frameJson: CaptureScreenFile = await frameResponse.json();
          const b64img = `data:image/png;base64,${frameJson.img}`.trim();
          const frame: FrameData = {
            id: frameJson.created + i.toString(), // + Math.random().toString(), why do this?
            src: b64img,
            timestamp: Date.parse(frameJson.created),
          };
          frameData.push(frame);
          if (frameJson.vh) {
            frameVHs[frame.id] = JSON.parse(frameJson.vh);
          }
          if (frameJson.gesture) {
            frameGestures[frame.id] = createScreenGesture(frameJson.gesture);
          }
        } catch (e) {
          console.error("Error fetching frame data:", e);
          toast.error("Error fetching frame data");
        }
      }
      return {
        frames: frameData.sort((a, b) => a.timestamp - b.timestamp),
        vhs: frameVHs,
        gestures: frameGestures,
      };
    };
    populateFrameData(files).then(({ frames, vhs, gestures }) => {
      originalFrames.current = [...frames];
      originalVHs.current = { ...vhs };
      originalGestures.current = { ...gestures };

      // Only populate data if the form state is empty
      if (
        currFrames.length === 0 &&
        Object.keys(currVHs).length === 0 &&
        Object.keys(currGestures).length === 0
      ) {
        setValue("screens", frames);
        setValue("vhs", vhs);
        setValue("gestures", gestures);
      }
    });
  }, [currFrames.length, files, setValue]);

  return (
    <div className="flex w-full h-full gap-4 md:gap-6">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={33} minSize={25} maxSize={50}>
          <div className="flex flex-col grow justify-center items-center h-full max-h-full gap-4 md:p-6 bg-neutral-50 dark:bg-neutral-950">
            {isFilesLoading ?? (
              <div className="max-w-full max-h-[calc(100%-4rem)] bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-lg aspect-[1/2]"></div>
            )}
            <Button
              onClick={() => {
                if (originalFrames.current.length !== currFrames.length) {
                  setValue("screens", originalFrames.current);
                  setValue("vhs", originalVHs.current);
                  setValue("gestures", originalGestures.current);
                }
              }}
            >
              <ListRestart /> Reset Frames
            </Button>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={67}>
          <div className="flex w-full h-full overflow-auto">
            <FrameGalleryAndroid
              frames={currFrames}
              vhs={currVHs}
              gestures={currGestures}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

const ExtractFramesIOS = ({ capture }: { capture: any }) => {
  const { setValue } = useFormContext<TraceFormData>();
  const [watchScreens, watchGestures] = useWatch({
    name: ["screens", "gestures"],
  });
  const frames = watchScreens as FrameData[];
  const gestures = watchGestures as { [key: string]: ScreenGesture };

  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);

  const [currentTime, setCurrentTime] = useState(0);
  const [frameStep, setFrameStep] = useState(1 / 60);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch file data
  const { data: files = [], isLoading: isFilesLoading } = useSWR(
    capture.id ? ["Capture files", `processed/${capture.id}`] : null,
    fileFetcher
  );

  // Thumbnails are from `thumbnails` folder in captureFiles
  const thumbnails = useMemo(() => {
    const video = videoRef.current;
    if (!video || videoDuration === 0) return [];
    const thumbnailFiles = files.filter((f) =>
      f.fileKey.includes("thumbnails/")
    );
    return thumbnailFiles.map((f, index) => ({
      src: f.fileUrl,
      timestamp: (videoDuration / thumbnailFiles.length) * index,
      width: video.videoWidth,
      height: video.videoHeight,
    }));
  }, [files, videoRef, videoDuration]);

  const videoFiles = useMemo(() => {
    return files.filter((f) => /\.(webm)$/.test(f.fileKey));
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

      video.fastSeek(t);
      setCurrentTime(t);
    },
    [videoRef, videoDuration]
  );

  const handleCaptureFrame = async () => {
    if (!videoRef.current) return;
    const f = await extractVideoFrame(videoRef.current, currentTime);
    setValue(
      "screens",
      [...frames, f].sort((a, b) => a.timestamp - b.timestamp)
    );
  };

  // Play/Pause toggle
  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? await video.play() : video.pause();
  };

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
    [handleCaptureFrame]
  );

  return (
    <div className="flex flex-col w-full h-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={33}
          minSize={25}
          maxSize={50}
          className="flex flex-col justify-center items-center h-full min-h-0 p-4 md:p-6 bg-neutral-50 dark:bg-neutral-950 box-border"
        >
          <div className="flex flex-col justify-center items-center w-full h-full gap-4">
            {isFilesLoading || videoFiles.length === 0 ? (
              <div className="flex grow max-w-full max-h-full bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-lg aspect-[1/2]"></div>
            ) : (
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
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={67}>
          <FrameGalleryIOS
            frames={frames}
            gestures={gestures}
            setTime={handleSetTime}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      <FrameTimeline
        src={""}
        thumbnails={thumbnails}
        currentTime={currentTime}
        videoDuration={videoDuration}
        isPlaying={isPlaying}
        handleSetTime={handleSetTime}
        handlePlayPause={handlePlayPause}
        handleCapture={handleCaptureFrame}
      />
    </div>
  );
};
