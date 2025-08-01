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
import { updateCapture } from "@/lib/actions";

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
    setIsSubmitting(true);
    const res = await approveCapture(traceData, capture);
    if (!res.ok) {
      toast.error(res.message);
    } else {
      await handleTraceSave(traceData, capture);
      const updateRes = await updateCapture(capture.id, {
        status: CaptureStatus.APPROVED,
      });
      if (!updateRes.ok) {
        toast.error(updateRes.message ?? "Failed to update capture");
      } else {
        toast.success("Capture approved successfully");
        router.push(`/app/${capture.appId}`);
      }
    }
    setIsSubmitting(false);
  };

  const handleDeny = async () => {
    setIsSubmitting(true);
    const res = await denyCapture(capture);
    if (!res.ok) {
      toast.error(res.message);
    } else {
      toast.success(res.message);
      router.push(`/capture/${capture.id}/edit`);
    }
    setIsSubmitting(false);
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
