"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
      router.push(`/admin/tasks`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred",
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
  };

  return (
    <aside className="w-full h-full flex flex-col min-h-0 p-3">
      {/* Header: badges — fixed at top */}
      <div className="flex-shrink-0 space-y-2">
        <Badge variant={isAdmin ? "default" : "secondary"}>
          {isAdmin ? "Admin Review" : "Owner Review"}
        </Badge>
        <Badge variant="default" className="bg-gray-500 block w-full">
          <article className="prose prose-neutral dark:prose-invert leading-snug font-sm text-white dark:text-neutral-900 w-full whitespace-pre-wrap">
            <p className="text-center">
              Task: {capture.task.description ?? "No task provided."}
            </p>
          </article>
        </Badge>
      </div>

      {/* Scrollable content: video + feedback textareas */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-4 py-3">
          <div className="flex justify-center w-full">
            <video
              ref={videoRef}
              crossOrigin="anonymous"
              preload="auto"
              className="w-1/2 min-w-0 h-auto rounded-lg object-contain"
              controls={true}
            />
          </div>
          {isAdmin && (
            <div className="flex flex-col gap-3 w-full">
              <div className="flex flex-col gap-1.5 w-full">
                <Label htmlFor="annotateFeedback">Annotate:</Label>
                <Textarea
                  className="w-full min-h-[4rem] resize-y"
                  id="annotateFeedback"
                  placeholder="Annotate feedback"
                  value={annotateFeedback}
                  onChange={(e) => setAnnotateFeedback(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <Label htmlFor="redactFeedback">Redact:</Label>
                <Textarea
                  className="w-full min-h-[4rem] resize-y"
                  id="redactFeedback"
                  placeholder="Redact feedback"
                  value={redactFeedback}
                  onChange={(e) => setRedactFeedback(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <Label htmlFor="summarizeFeedback">Summarize:</Label>
                <Textarea
                  className="w-full min-h-[4rem] resize-y"
                  id="summarizeFeedback"
                  placeholder="Description feedback"
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
        <div className="flex-shrink-0 flex flex-row justify-center gap-2 pt-3 mt-auto border-t border-neutral-200 dark:border-neutral-800">
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
