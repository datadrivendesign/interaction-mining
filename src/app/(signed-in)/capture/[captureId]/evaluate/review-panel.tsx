"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TraceFormData } from "../edit/components/types";
import { Capture, CaptureStatus } from "@prisma/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { approveCapture, denyCapture } from "./utils/capture-actions";
import { toast } from "sonner";
import { handleTraceSave } from "../edit/util";
import { revalidateCaptureCache, updateCapture } from "@/lib/actions";

export function ReviewPanel({
  traceData,
  capture,
  router,
  isAdmin,
}: {
  traceData: TraceFormData;
  capture: Capture;
  router: AppRouterInstance;
  isAdmin: boolean;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await revalidateCaptureCache();
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
      await revalidateCaptureCache();
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
        <article className="prose prose-neutral dark:prose-invert leading-snug font-sm font-semibold text-white dark:text-neutral-900 overflow-auto w-full whitespace-pre-wrap">
          <p className="text-center">
            {traceData.description ?? "No description provided."}
          </p>
        </article>
      </Badge>
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
