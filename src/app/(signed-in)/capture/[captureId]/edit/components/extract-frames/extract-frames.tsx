"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Camera, ListRestart } from "lucide-react";
import { FrameGalleryAndroid, FrameGalleryIOS } from "./extract-frames-gallery";
import { TraceFormData } from "../types";

import { ListedFiles, CaptureScreenFile, getCaptureFiles } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FrameData } from "../types";
import { ScreenGesture } from "@prisma/client";
import FrameTimeline from "./extract-frames-timeline";
import { useMeasure } from "@uidotdev/usehooks";
import { set } from "mongoose";

export async function fileFetcher([_, captureId]: [string, string]) {
  let res = await getCaptureFiles(captureId);

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
    capture.id ? ["", capture.id] : null,
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [timelineRef, timelineMeasure] = useMeasure();

  // Fetch file data
  const { data: captures = [], isLoading: isCapturesLoading } = useSWR(
    capture.id ? ["", capture.id] : null,
    fileFetcher
  );

  const handleCaptureFrame = async () => {
    if (!videoRef.current) return;
    const f = await extractVideoFrame(videoRef.current, currentTime);
    setValue(
      "screens",
      [...frames, f].sort((a, b) => a.timestamp - b.timestamp)
    );
  };

  /**
   * Extracts frame from the video at current timestamp using WebCodecs API
   * @param video HTML object of video element to extract from
   */
  async function extractVideoFrame(
    video: HTMLVideoElement,
    t: number,
    scale: number = 1
  ): Promise<FrameData> {
    // Seek to desired time without affecting UI playback
    const originalTime = video.currentTime;
    const seeking = new Promise<void>((res) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        res();
      };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = t;
    });
    await seeking;
    // Create a VideoFrame from the video element
    const vf = new VideoFrame(video);
    // Create an ImageBitmap with resizing
    const bitmap = await createImageBitmap(vf, {
      resizeWidth: Math.floor(vf.codedWidth * scale),
      resizeHeight: Math.floor(vf.codedHeight * scale),
    });
    // Draw onto canvas
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context error");
    ctx.drawImage(bitmap, 0, 0);
    // Cleanup
    vf.close();
    bitmap.close();
    // Restore original time (optional, UI unaffected by offscreen usage)
    // Return frame data
    return {
      id: `${t}-${Math.random()}`,
      src: canvas.toDataURL(),
      timestamp: t,
    };
  }

  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnails, setThumbnails] = useState<FrameData[]>([]);

  // Load thumbnails
  const onLoadedMetadata = useCallback(
    async (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget;
      if (!videoRef.current) return;

      setIsVideoLoading(false);

      // Create an offscreen video element to avoid disrupting the UI player
      const thumbVideo = document.createElement("video");
      thumbVideo.crossOrigin = "anonymous";
      thumbVideo.preload = "metadata";
      thumbVideo.src = captures[0].fileUrl;
      // Wait for metadata to load on the offscreen video
      await new Promise<void>((res) =>
        thumbVideo.addEventListener("loadedmetadata", () => res(), {
          once: true,
        })
      );
      const videoWidth = thumbVideo.videoWidth;
      const videoHeight = thumbVideo.videoHeight;

      const timelineWidth = timelineMeasure.width ?? 0;
      const timelineHeight = timelineMeasure.height ?? 0;

      const thumbnailHeight = timelineHeight;
      const thumbnailWidth = (videoWidth / videoHeight) * thumbnailHeight;

      const numSteps = Math.ceil(timelineWidth / thumbnailWidth);

      const thumbs = Array.from({ length: numSteps }, (_, i) => {
        const t = (thumbVideo.duration / numSteps) * i;
        return extractVideoFrame(thumbVideo, t, thumbnailWidth / videoWidth);
      });
      const thumbsRes = await Promise.all(thumbs);

      console.log("Thumbnails loaded", thumbsRes);

      setThumbnails(thumbsRes);
      setVideoDuration(thumbVideo.duration);
    },
    [timelineMeasure, captures]
  );

  const handleSetTime = (t: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = t;
    if (videoRef.current.ended || t === videoDuration) videoRef.current.pause();
    setCurrentTime(t);
  };

  // Play/Pause toggle
  const handlePlayPause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.paused ? vid.play() : vid.pause();
  };

  return (
    <div className="flex flex-col w-full h-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={33}
          minSize={25}
          maxSize={50}
          className="flex flex-col justify-center items-center h-full min-h-0 p-4 md:p-6 bg-neutral-50 dark:bg-neutral-950 box-border"
        >
          <div className="flex flex-col items-center w-full h-full gap-4 overflow-hidden">
            {isCapturesLoading ? (
              <div className="max-w-full h-full max-h-full bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-lg aspect-[1/2]"></div>
            ) : (
              <video
                crossOrigin="anonymous"
                className="max-w-full max-h-full rounded-lg object-contain"
                controls={false}
                ref={videoRef}
                onTimeUpdate={(e) =>
                  setCurrentTime(e.currentTarget.currentTime)
                }
                onLoadedMetadata={onLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                typeof="video/mp4"
              >
                <source src={captures[0].fileUrl} type="video/mp4" />
              </video>
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
        ref={timelineRef}
        thumbnails={thumbnails}
        currentTime={currentTime}
        videoDuration={videoDuration}
        isPlaying={isPlaying}
        onSetTime={handleSetTime}
        onPlayPause={handlePlayPause}
        onCapture={handleCaptureFrame}
      />
    </div>
  );
};
