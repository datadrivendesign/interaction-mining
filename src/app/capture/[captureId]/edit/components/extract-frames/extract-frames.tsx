// "use client";

// import React, { useRef } from "react";
// import useSWR from "swr";
// import { useFormContext } from "react-hook-form";
// import { toast } from "sonner";
// import { Camera } from "lucide-react";
// import FrameGallery from "./extract-frames-gallery";
// import FrameTimeline from "./extract-frames-timeline";
// import { TraceFormData } from "../../page";

// import { getUploadedCaptureFiles } from "@/lib/actions";
// import { Button } from "@/components/ui/button";
// import {
//   ResizableHandle,
//   ResizablePanel,
//   ResizablePanelGroup,
// } from "@/components/ui/resizable";

// export type FrameData = {
//   id: string;
//   url: string;
//   timestamp: number;
// };

// export async function fileFetcher([_, captureId]: [string, string]) {
//   let res = await getUploadedCaptureFiles(captureId);

//   if (res.ok) {
//     return res.data;
//   } else {
//     console.error("Failed to fetch uploaded files", res.message);
//     toast.error("Failed to fetch uploaded files");
//     return [];
//   }
// }

// export default function ExtractFrames({ capture }: { capture: any }) {
//   const { setValue, watch } = useFormContext<TraceFormData>();
//   const frames = watch("screens") as FrameData[];

//   const videoRef = useRef<HTMLVideoElement | null>(null);

//   // Fetch file data
//   const { data: captures = [], isLoading: isCapturesLoading } = useSWR(
//     capture.id ? ["", capture.id] : null,
//     fileFetcher
//   );

//   const handleCaptureFrame = async () => {
//     if (videoRef.current !== null) {
//       const frame = await extractVideoFrame(videoRef.current);

//       setValue(
//         "screens",
//         [...frames, frame].sort((a, b) => a.timestamp - b.timestamp)
//       );
//     }
//   };

//   /**
//    * Extracts frame from the video at current timestamp
//    * @param video HTML object of video element to extract from
//    */
//   const extractVideoFrame = (video: HTMLVideoElement): Promise<FrameData> => {
//     return new Promise(
//       async (
//         resolve: (frame: FrameData) => void,
//         reject: (error: string) => void
//       ) => {
//         let canvas: HTMLCanvasElement = document.createElement("canvas");
//         let context: CanvasRenderingContext2D | null = canvas.getContext("2d");
//         if (context === null) {
//           console.error("HTML canvas could not get 2d context");
//           reject("canvas creation error");
//           return;
//         }
//         canvas.width = video.videoWidth;
//         canvas.height = video.videoHeight;
//         let time = video.currentTime;

//         let eventCallback = () => {
//           video.removeEventListener("seeked", eventCallback);
//           storeFrame(video, context, canvas, time, resolve);
//         };
//         video.addEventListener("seeked", eventCallback);
//         video.currentTime = time;
//       }
//     );
//   };

//   const storeFrame = (
//     video: HTMLVideoElement,
//     context: CanvasRenderingContext2D,
//     canvas: HTMLCanvasElement,
//     time: number,
//     resolve: (frame: FrameData) => void
//   ) => {
//     context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
//     resolve({
//       id: time.toString() + Math.random().toString(),
//       url: canvas.toDataURL(),
//       timestamp: time,
//     });
//   };

//   const handleSetTime = (time: number) => {
//     if (videoRef.current !== null) {
//       videoRef.current.currentTime = time;
//     }
//   };

//   return (
//     <div className="flex flex-col w-full h-[calc(100dvh-var(--nav-height))]">
//       {/* Video + Gallery */}
//       <div className="flex-1 w-full h-0 min-h-0 overflow-hidden">
//         <ResizablePanelGroup direction="horizontal">
//           <ResizablePanel defaultSize={33} minSize={25} maxSize={50}>
//             <div className="flex flex-col grow justify-center items-center h-full max-h-full p-6 bg-neutral-50 dark:bg-neutral-950">
//               {isCapturesLoading ? (
//                 <div className="max-w-full max-h-[calc(100%-4rem)] bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-lg aspect-[1/2]" />
//               ) : (
//                 <video
//                   crossOrigin="anonymous"
//                   className="z-0 max-w-full max-h-[calc(100%-4rem)] mb-4 rounded-lg"
//                   controls
//                   ref={videoRef}
//                 >
//                   <source src={captures[0].fileUrl} type="video/mp4" />
//                 </video>
//               )}
//               <Button onClick={handleCaptureFrame}>
//                 <Camera className="mr-2" />
//                 Snapshot
//               </Button>
//             </div>
//           </ResizablePanel>
//           <ResizableHandle withHandle />
//           <ResizablePanel defaultSize={67}>
//             <div className="flex w-full h-full overflow-auto">
//               <FrameGallery frames={frames} setTime={handleSetTime} />
//             </div>
//           </ResizablePanel>
//         </ResizablePanelGroup>
//       </div>

//       {/* Timeline */}
//       <div className="w-full h-20 p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900">
//         <FrameTimeline frames={frames} setTime={handleSetTime} />
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useRef, useState, useEffect } from "react";
import useSWR from "swr";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import FrameGallery from "./extract-frames-gallery";
import FrameTimeline from "./extract-frames-timeline";
import { TraceFormData } from "../../page";

import { getUploadedCaptureFiles } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export type FrameData = {
  id: string;
  url: string;
  timestamp: number;
};

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

export default function ExtractFrames({ capture }: { capture: any }) {
  const { setValue, watch } = useFormContext<TraceFormData>();
  const frames = watch("screens") as FrameData[];

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // State for video playback tracking.
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch file data using SWR.
  const { data: captures = [], isLoading: isCapturesLoading } = useSWR(
    capture.id ? ["", capture.id] : null,
    fileFetcher
  );

  // Capture a frame (snapshot) from the video.
  const handleCaptureFrame = async () => {
    if (videoRef.current !== null) {
      const frame = await extractVideoFrame(videoRef.current);
      setValue("screens", [...frames, frame].sort((a, b) => a.timestamp - b.timestamp));
    }
  };

  // Extract a frame from the video element.
  const extractVideoFrame = (video: HTMLVideoElement): Promise<FrameData> => {
    return new Promise((resolve, reject) => {
      const canvas: HTMLCanvasElement = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context === null) {
        console.error("HTML canvas could not get 2d context");
        reject("canvas creation error");
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const time = video.currentTime;

      const eventCallback = () => {
        video.removeEventListener("seeked", eventCallback);
        storeFrame(video, context, canvas, time, resolve);
      };
      video.addEventListener("seeked", eventCallback);
      video.currentTime = time;
    });
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

  // Callback for timeline scrubber and frame clicks.
  const handleSetTime = (time: number) => {
    if (videoRef.current !== null) {
      videoRef.current.currentTime = time;
    }
  };

  // Attach event listeners to the video element to update state.
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setVideoDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  return (
    <div className="flex flex-col w-full h-[calc(100dvh-var(--nav-height))]">
      {/* Video + Gallery Section */}
      <div className="flex-1 w-full h-0 min-h-0 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={33} minSize={25} maxSize={50}>
            <div className="flex flex-col grow justify-center items-center h-full max-h-full p-6 bg-neutral-50 dark:bg-neutral-950">
              {isCapturesLoading ? (
                <div className="max-w-full max-h-[calc(100%-4rem)] bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-lg aspect-[1/2]" />
              ) : (
                // Removed native controls to let custom controls work.
                <video
                  crossOrigin="anonymous"
                  className="z-0 max-w-full max-h-[calc(100%-4rem)] mb-4 rounded-lg"
                  ref={videoRef}
                >
                  <source src={captures[0].fileUrl} type="video/mp4" />
                </video>
              )}
              <Button onClick={handleCaptureFrame}>
                <Camera className="mr-2" />
                Snapshot
              </Button>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={67}>
            <div className="flex w-full h-full overflow-auto">
              <FrameGallery frames={frames} setTime={handleSetTime} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Timeline Section */}
      <FrameTimeline
        frames={frames}
        currentTime={currentTime}
        videoDuration={videoDuration}
        isPlaying={isPlaying}
        onSetTime={handleSetTime}
        onPlayPause={() => {
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play();
            } else {
              videoRef.current.pause();
            }
          }
        }}
        onBackward={() => {
          if (videoRef.current) {
            videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 2, 0);
          }
        }}
        onForward={() => {
          if (videoRef.current) {
            videoRef.current.currentTime = videoRef.current.currentTime + 2;
          }
        }}
      />
    </div>
  );
}
