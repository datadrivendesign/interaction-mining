"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useState } from "react";
import { TraceFormData } from "../../../edit/components/types";
import { CaptureStatus } from "@prisma/client";
import {
  validateApprovePermissions,
  denyCapture,
} from "../../utils/capture-actions";
import { toast } from "sonner";
import { handleTraceSave } from "../../../edit/util";
import { Capture, revalidateCaptureCaches, updateCapture } from "@/lib/actions";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { useHotkeys } from "react-hotkeys-hook";
import { cn } from "@/lib/utils";

export function ReviewPanelIOS({
  traceData,
  capture,
  isAdmin,
  videoRef,
}: {
  traceData: TraceFormData;
  capture: Capture;
  isAdmin: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [annotateFeedback, setAnnotateFeedback] = useState(
    capture.annotateFeedback ?? "",
  );
  const [redactFeedback, setRedactFeedback] = useState(
    capture.redactFeedback ?? "",
  );
  const [summarizeFeedback, setSummarizeFeedback] = useState(
    capture.summarizeFeedback ?? "",
  );
  const [videoOrientation, setVideoOrientation] = useState<
    "portrait" | "landscape" | null
  >(null);

  const router = useRouter();

  const handleApprove = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const approveRes = await validateApprovePermissions();
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
      router.push(`/admin/tasks`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [capture, router, traceData]);

  const handleDeny = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const denyRes = await denyCapture(
        capture,
        annotateFeedback,
        redactFeedback,
        summarizeFeedback,
      );
      if (!denyRes.ok) {
        throw new Error(denyRes.message);
      }
      await revalidateCaptureCaches();
      toast.success("Capture denied successfully");
      router.push(`/admin/tasks`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [annotateFeedback, capture, redactFeedback, router, summarizeFeedback]);

  useHotkeys(
    "ctrl+shift+a",
    (event) => {
      event.preventDefault();
      void handleApprove();
    },
    {
      enabled: isAdmin && !isSubmitting,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [handleApprove, isAdmin, isSubmitting],
  );

  useHotkeys(
    "ctrl+shift+d",
    (event) => {
      event.preventDefault();
      void handleDeny();
    },
    {
      enabled: isAdmin && !isSubmitting,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      ignoreEventWhen: (event) => event.repeat,
      preventDefault: true,
    },
    [handleDeny, isAdmin, isSubmitting],
  );
  const videoSizeClass = videoOrientation === "landscape" ? "w-[95%]" : "w-1/2";

  return (
    <aside className="w-full h-full flex flex-col min-h-0">
      {/* Header strip */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 h-9 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
        <span className={cn("size-1.5 rounded-full shrink-0", isAdmin ? "bg-amber-500" : "bg-neutral-400")} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          {isAdmin ? "Admin Review" : "Owner Review"}
        </span>
      </div>

      {/* Scrollable content: video + feedback textareas */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-4 p-3">
          {traceData.description && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                Task
              </span>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-snug">
                {traceData.description}
              </p>
            </div>
          )}
          <div className="flex justify-center w-full">
            <video
              ref={videoRef}
              crossOrigin="anonymous"
              preload="auto"
              className={`${videoSizeClass} min-w-0 h-auto rounded-lg object-contain`}
              controls={true}
              onLoadedMetadata={(event) => {
                const videoElement = event.currentTarget;
                if (!videoElement.videoWidth || !videoElement.videoHeight) {
                  return;
                }
                setVideoOrientation(
                  videoElement.videoWidth > videoElement.videoHeight
                    ? "landscape"
                    : "portrait",
                );
              }}
            />
          </div>
          {isAdmin && (
            <div className="flex flex-col gap-0 w-full rounded-md border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              {/* Summarize */}
              <div className="flex flex-col gap-1.5 p-3 border-l-2 border-l-violet-500">
                <Label htmlFor="summarizeFeedback" className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">
                  Summarize
                </Label>
                <Textarea
                  className="w-full min-h-[3.5rem] resize-y text-xs border-0 p-0 shadow-none focus-visible:ring-0 bg-transparent"
                  id="summarizeFeedback"
                  placeholder="Feedback on task description…"
                  value={summarizeFeedback}
                  onChange={(e) => setSummarizeFeedback(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer: Approve/Deny always reachable (admin only) */}
      {isAdmin && (
        <div className="flex-shrink-0 flex flex-row w-full gap-2 px-3 py-2 border-t border-neutral-200 dark:border-neutral-800">
          <Button
            size="sm"
            className="flex-1 min-w-0 bg-green-600 text-white hover:bg-green-700 dark:bg-green-700! dark:hover:bg-green-800! dark:text-white!"
            onClick={handleApprove}
            disabled={isSubmitting}
          >
            Approve
          </Button>
          <Button
            size="sm"
            className="flex-1 min-w-0 bg-red-500 text-white hover:bg-red-600 dark:bg-red-700! dark:hover:bg-red-800! dark:text-white!"
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
