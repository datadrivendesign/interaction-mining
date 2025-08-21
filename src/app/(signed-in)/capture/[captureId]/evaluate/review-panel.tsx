"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TraceFormData } from "../edit/components/types";
import { CaptureStatus } from "@prisma/client";
import {
  validateApprovePermissions,
  denyCapture,
} from "./utils/capture-actions";
import { toast } from "sonner";
import { handleTraceSave } from "../edit/util";
import { Capture, revalidateCaptureCaches, updateCapture } from "@/lib/actions";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

export function ReviewPanel({
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
    capture.annotateFeedback ?? ""
  );
  const [redactFeedback, setRedactFeedback] = useState(
    capture.redactFeedback ?? ""
  );
  const [summarizeFeedback, setSummarizeFeedback] = useState(
    capture.summarizeFeedback ?? ""
  );

  const router = useRouter();

  const handleApprove = async () => {
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
      const denyRes = await denyCapture(
        capture,
        annotateFeedback,
        redactFeedback,
        summarizeFeedback
      );
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
          className="w-1/2 h-auto rounded-lg object-contain"
          controls={true}
        />
      </div>
      {isAdmin && (
        <div className="flex flex-col justify-center items-center w-full h-full gap-3 my-3">
          <div className="flex flex-col gap-3 items-center w-full">
            <div className="flex flex-col gap-3 px-3 items-start w-full">
              <Label htmlFor="annotateFeedback">Annotate:</Label>
              <Textarea
                className="w-full h-full"
                id="annotateFeedback"
                placeholder="Annotate feedback"
                value={annotateFeedback}
                onChange={(e) => setAnnotateFeedback(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 px-3 items-start w-full">
              <Label htmlFor="redactFeedback">Redact:</Label>
              <Textarea
                className="w-full h-full"
                id="redactFeedback"
                placeholder="Redact feedback"
                value={redactFeedback}
                onChange={(e) => setRedactFeedback(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 px-3 items-start w-full">
              <Label htmlFor="summarizeFeedback">Summarize:</Label>
              <Textarea
                className="w-full h-full"
                id="summarizeFeedback"
                placeholder="Summarize feedback"
                value={summarizeFeedback}
                onChange={(e) => setSummarizeFeedback(e.target.value)}
              />
            </div>
          </div>
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
