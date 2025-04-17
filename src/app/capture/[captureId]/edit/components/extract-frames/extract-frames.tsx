"use client";

import React, { useEffect, useRef } from "react";
import useSWR from "swr";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Camera, ListRestart } from "lucide-react";
import { FrameGalleryAndroid, FrameGalleryIOS } from "./extract-frames-gallery";
import { TraceFormData } from "../../page";

import { CaptureListedFile, CaptureScreenFile, CaptureScreenGesture, getUploadedCaptureFiles } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FrameData } from "../types";
import { ScreenGesture } from "@prisma/client";

export async function fileFetcher([_, captureId]: [string, string]) {
  let res = await getUploadedCaptureFiles(captureId);

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
      {(capture.task.os as string).toLowerCase() === "android" ? 
        (<ExtractFramesAndroid capture={capture} />) : 
        (<ExtractFramesIOS capture={capture} />)}
    </>
  )
}

const ExtractFramesAndroid = ({ capture }: { capture: any }) => {
  const { setValue, watch } = useFormContext<TraceFormData>();
  const originalFrames = useRef<FrameData[]>([]);
  const originalVHs = useRef<{[key: string]: any}>({});
  const originalGestures = useRef<{ [key: string]: ScreenGesture }>({});
  const frames = watch("screens") as FrameData[];
  const vhs = watch("vhs") as { [key: string]: any };
  const gestures = watch("gestures") as { [key: string]: ScreenGesture };

  // Fetch file data
  const { data: captures = [], isLoading: isCapturesLoading } = useSWR(
    capture.id ? ["", capture.id] : null,
    fileFetcher
  );

  useEffect(() => {
    const populateFrameData = async (
      captures: CaptureListedFile[]
    ): Promise<{
      frames: FrameData[], 
      vhs: { [key: string]: any }, 
      gestures: { [key: string]: ScreenGesture }
    }> => {
  
      function createScreenGesture(gesture: CaptureScreenGesture): ScreenGesture {
        const { x, y, scrollDeltaX, scrollDeltaY, type } = gesture
        const screenGesture: ScreenGesture = {
          type: null,
          x,
          y,
          scrollDeltaX,
          scrollDeltaY,
          description: ""
        }
        if (!type) {
          screenGesture.type = null
        } else if (type === "TYPE_VIEW_CLICKED") {
          screenGesture.type = "Tap"
        } else if (type === "TYPE_VIEW_LONG_CLICKED") {
          screenGesture.type = "Touch and hold"
        } else if (type === "TYPE_VIEW_SCROLLED") {
          // get directionality of scroll/swipe,choose dominant delta direction
          if (scrollDeltaX > 0 && scrollDeltaX > scrollDeltaY) {
            screenGesture.type = "Swipe right"
          } else if (scrollDeltaX < 0 && scrollDeltaX < scrollDeltaY) {
            screenGesture.type = "Swipe left"
          } else if (scrollDeltaY > 0 && scrollDeltaY > scrollDeltaX) {
            screenGesture.type = "Swipe up"
          } else if (scrollDeltaY < 0 && scrollDeltaY < scrollDeltaX) {
            screenGesture.type = "Swipe down"
          } else { // fall through case, don't know what will reach
            screenGesture.type = "Swipe"
          }
        } else {
          screenGesture.type = null
        }      
        return screenGesture
      }
  
      const frameData: FrameData[] = [];
      const frameVHs: { [key: string]: any } = {};
      const frameGestures: { [key: string]: ScreenGesture } = {};
      for (const c of captures) {
        try {
          const frameResponse = await fetch(c.fileUrl);
          console.log(c)
          const frameJson: CaptureScreenFile = await frameResponse.json();
          const b64img = `data:image/png;base64,${frameJson.img}`.trim();
          const frame: FrameData = { 
            id: frameJson.created + Math.random().toString(),
            url: b64img,
            timestamp: Date.parse(frameJson.created),
          };
          frameData.push(frame);
          if (frameJson.vh) {
            frameVHs[frame.id] = JSON.parse(frameJson.vh);
          }
          if (frameJson.gesture) {
            frameGestures[frame.id] = createScreenGesture(frameJson.gesture);
          }
        } catch(e) {
          console.error("Error fetching frame data:", e);
          toast.error("Error fetching frame data");
        }
      }
      return {
        frames: frameData.sort((a, b) => a.timestamp - b.timestamp),
        vhs: frameVHs,
        gestures: frameGestures,
      }
    }
    populateFrameData(captures).then(({ frames, vhs, gestures }) => {
      originalFrames.current = [...frames];
      originalVHs.current = {...vhs};
      originalGestures.current = {...gestures};
      setValue("screens", frames)
      setValue("vhs", vhs)
      setValue("gestures", gestures)
    });
  }, [captures, capture, setValue])  // TODO: check if this screws up Android

  return (
  <div className="flex flex-row w-full h-[calc(100dvh-var(--nav-height))] gap-6">
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={33} minSize={25} maxSize={50}>
        <div className="flex flex-col grow justify-center items-center h-full max-h-full p-6 bg-neutral-50 dark:bg-neutral-950">
          {isCapturesLoading ?? (
            <div className="max-w-full max-h-[calc(100%-4rem)] bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-lg aspect-[1/2]"></div>
          )}
          <Button onClick={() => {
            if (originalFrames.current.length !== frames.length) {
              setValue("screens", originalFrames.current)
              setValue("vhs", originalVHs.current)
              setValue("gestures", originalGestures.current)
            }
          }}>
            <ListRestart /> Reset Frames
          </Button>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={67}>
        <div className="flex w-full h-full overflow-auto">
        <FrameGalleryAndroid frames={frames} vhs={vhs} gestures={gestures} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
);
}

const ExtractFramesIOS = ({ capture }: { capture: any }) => {
  const { setValue, watch } = useFormContext<TraceFormData>();
  const frames = watch("screens") as FrameData[];
  const gestures = watch("gestures") as { [key: string]: ScreenGesture };

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch file data
  const { data: captures = [], isLoading: isCapturesLoading } = useSWR(
    capture.id ? ["", capture.id] : null,
    fileFetcher
  );

  const handleCaptureFrame = async () => {
    if (videoRef.current !== null) {
      const frame = await extractVideoFrame(videoRef.current);

      setValue(
        "screens",
        [...frames, frame].sort((a, b) => a.timestamp - b.timestamp)
      );
    }
  };

  /**
   * Extracts frame from the video at current timestamp
   * @param video HTML object of video element to extract from
   */
  const extractVideoFrame = (video: HTMLVideoElement): Promise<FrameData> => {
    return new Promise(
      async (
        resolve: (frame: FrameData) => void,
        reject: (error: string) => void
      ) => {
        let canvas: HTMLCanvasElement = document.createElement("canvas");
        let context: CanvasRenderingContext2D | null = canvas.getContext("2d");
        if (context === null) {
          console.error("HTML canvas could not get 2d context");
          reject("canvas creation error");
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        let time = video.currentTime;

        let eventCallback = () => {
          video.removeEventListener("seeked", eventCallback);
          storeFrame(video, context, canvas, time, resolve);
        };
        video.addEventListener("seeked", eventCallback);
        video.currentTime = time;
      }
    );
  };

  const storeFrame = (
    video: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    time: number,
    resolve: (frame: FrameData) => void
  ) => {
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    resolve({
      id: time.toString() + Math.random().toString(),
      url: canvas.toDataURL(),
      timestamp: time,
    });
  };

  const handleSetTime = (time: number) => {
    if (videoRef.current !== null) {
      videoRef.current.currentTime = time;
    }
  };

  return (
    <div className="flex flex-row w-full h-[calc(100dvh-var(--nav-height))] gap-6">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={33} minSize={25} maxSize={50}>
          <div className="flex flex-col grow justify-center items-center h-full max-h-full p-6 bg-neutral-50 dark:bg-neutral-950">
            {isCapturesLoading ? (
              <div className="max-w-full max-h-[calc(100%-4rem)] bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-lg aspect-[1/2]"></div>
            ) : (
              <video
                crossOrigin="anonymous"
                className="z-0 max-w-full max-h-[calc(100%-4rem)] mb-4 rounded-lg"
                controls
                ref={videoRef}
              >
                <source src={captures[0].fileUrl} type="video/mp4" />
              </video>
            )}
            <Button onClick={handleCaptureFrame}>
              <Camera /> Snapshot
            </Button>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={67}>
          <div className="flex w-full h-full overflow-auto">
            <FrameGalleryIOS 
              frames={frames} 
              gestures={gestures} 
              setTime={handleSetTime} 
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
