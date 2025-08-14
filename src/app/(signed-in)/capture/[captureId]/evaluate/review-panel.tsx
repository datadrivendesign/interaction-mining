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

  useEffect(() => {
    fetchVideoFile(`uploads/${capture.id}`).then((videoFiles) => {
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
    });
  }, [capture.id, videoRef]);

  const populateDraftScreens = useCallback(
    async (video: HTMLVideoElement, screens: FrameData[]) => {
      const frames: FrameData[] = [];
      // Before the loop, do a "warm-up" seek to ensure video is loaded:
      await extractVideoFrame(video, 0.1);
      for (const s of screens) {
        if (!s.src) {
          const f = await extractVideoFrame(video, s.timestamp);
          s.src = f.src;
        }
        frames.push(s);
      }
      return frames;
    },
    []
  );

  useEffect(() => {
    if (!videoRef || !videoRef.current) {
      return;
    }
    // end early if all screens have src
    if (traceData.screens.filter((s) => s.src.length === 0).length === 0) {
      return;
    }
    populateDraftScreens(videoRef.current, traceData.screens).then((frames) => {
      setTraceData((prevData) => {
        if (!prevData) {
          return prevData;
        }
        return {
          ...prevData,
          screens: frames.sort((a, b) => a.timestamp - b.timestamp),
        };
      });
    });
  }, [populateDraftScreens, setTraceData, videoRef, traceData.screens]);

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
      const denyRes = await denyCapture(capture);
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

      <div className="flex flex-col justify-center items-center w-3/4 h-full">
        <video
          ref={videoRef}
          crossOrigin="anonymous"
          preload="auto"
          className="max-w-full max-h-full rounded-lg object-contain"
          controls={true}
        />
      </div>
      {isAdmin && (
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
      )}
    </aside>
  );
}
