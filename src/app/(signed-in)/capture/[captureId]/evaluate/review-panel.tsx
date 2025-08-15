"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FrameData, TraceFormData } from "../edit/components/types";
import { CaptureStatus } from "@prisma/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { approveCapture, denyCapture } from "./utils/capture-actions";
import { toast } from "sonner";
import { handleTraceSave } from "../edit/util";
import { Capture, revalidateCaptureCaches, updateCapture } from "@/lib/actions";
import { fetchVideoFile } from "./utils/file-fetch";
import { extractVideoFrame } from "../edit/components/repair-screen/util/ios-video-operations";
import { Textarea } from "@/components/ui/textarea";

export function ReviewPanel({
  traceData,
  setTraceData,
  capture,
  router,
  isAdmin,
}: {
  traceData: TraceFormData;
  setTraceData: Dispatch<SetStateAction<TraceFormData | undefined>>;
  capture: Capture;
  router: AppRouterInstance;
  isAdmin: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [feedback, setFeedback] = useState(capture.feedback ?? "");
  const isProcessingRef = useRef(false);

  const populateDraftScreens = useCallback(
    async (video: HTMLVideoElement, screens: FrameData[]) => {
      const frames: FrameData[] = [];
      try {
        // Create a copy of screens to avoid mutation issues
        const screensCopy = screens.map((screen) => ({ ...screen }));

        // Before the loop, do a "warm-up" seek to ensure video is loaded:
        await extractVideoFrame(video, 0.1);
        let i = 0;
        for (const s of screensCopy) {
          if (!s.src) {
            const f = await extractVideoFrame(video, s.timestamp);
            s.src = f.src; // Safe to mutate the copy
          }
          i++;
          frames.push(s);
        }
      } catch (error) {
        console.error(error);
        toast.error("Error extracting video frames");
      }
      return frames;
    },
    []
  );

  useEffect(() => {
    const loadVideoAndPopulateScreens = async () => {
      if (isProcessingRef.current) {
        // video is already being processed
        return;
      }

      try {
        // start load video
        isProcessingRef.current = true;
        const videoFiles = await fetchVideoFile(`uploads/${capture.id}`);
        if (videoFiles.length === 0 || !videoRef.current) {
          // video files not found or video ref not found
          return;
        }
        const response = await fetch(videoFiles[0].fileUrl);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const video = videoRef.current;
        video.src = objectUrl;
        // wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video load timeout"));
          }, 30000); // 30 second timeout

          const onLoadedData = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("error", onError);
            resolve();
          };

          const onError = (e: any) => {
            clearTimeout(timeout);
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("error", onError);
            reject(e);
          };

          video.addEventListener("loadeddata", onLoadedData, { once: true });
          video.addEventListener("error", onError, { once: true });
          // Check if already loaded
          if (video.readyState >= 2) {
            onLoadedData();
          }
        });
        // check if need to populate data
        if (traceData.screens.filter((s) => s.src.length === 0).length === 0) {
          // All screens already have src, skip frame extraction
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
        console.error(error);
        toast.error("Error loading video");
      } finally {
        isProcessingRef.current = false;
      }
    };

    loadVideoAndPopulateScreens();
  }, [capture.id, traceData.screens, populateDraftScreens]);

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      const approveRes = await approveCapture(traceData, capture);
      if (!approveRes.ok) {
        throw new Error(approveRes.message);
      }
      const saveRes = await handleTraceSave(traceData, capture);
      if (!saveRes.ok) {
        throw new Error(saveRes.message);
      }
      const updateRes = await updateCapture(capture.id, {
        status: CaptureStatus.APPROVED,
      });
      if (!updateRes.ok) {
        throw new Error(updateRes.message);
      }
      await revalidateCaptureCaches();
      toast.success("Capture approved successfully");
      router.push(`/app/${capture.appId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeny = async () => {
    try {
      setIsSubmitting(true);
      const denyRes = await denyCapture(capture, feedback);
      if (!denyRes.ok) {
        throw new Error(denyRes.message);
      }
      await revalidateCaptureCaches();
      toast.success("Capture denied successfully");
      router.push(`/capture/${capture.id}/edit`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-full h-full flex flex-col flex-grow justify-between p-3">
      <Badge variant={isAdmin ? "default" : "secondary"}>
        {isAdmin ? "Admin Review" : "Owner Review"}
      </Badge>
      <Badge variant="default" className="bg-gray-500 mt-5">
        <article className="prose prose-neutral dark:prose-invert leading-snug font-sm text-white dark:text-neutral-900 overflow-auto w-full whitespace-pre-wrap">
          <p className="text-center">
            Task: {capture.task.description ?? "No task provided."}
          </p>
        </article>
      </Badge>

      <div className="flex flex-col justify-center items-center w-full h-full gap-4 mt-5">
        <video
          ref={videoRef}
          crossOrigin="anonymous"
          preload="auto"
          className="w-1/2 max-h-full rounded-lg object-contain"
          controls={true}
        />
      </div>
      {isAdmin && (
        <div className="flex flex-col justify-center items-center w-full h-full gap-5 mb-5">
          <Textarea
            className="w-3/4"
            placeholder="Enter feedback for the capture"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex flex-row self-align-end justify-center gap-2 mb-5">
            <Button
              variant="outline"
              className="bg-green-600 text-white hover:bg-green-700 dark:bg-white dark:text-black"
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:text-white"
              onClick={handleDeny}
              disabled={isSubmitting}
            >
              Deny
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
