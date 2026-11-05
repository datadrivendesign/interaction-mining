"use client";

import { CaptureStatus, Prisma } from "@prisma/client";
import { SaveTraceGallery } from "./components/save-trace-gallery";
import { SaveTracePanel } from "./components/save-trace-panel";

export default function Review({
  capture,
}: {
  capture:
    | Prisma.CaptureGetPayload<{
        include: {
          app: true;
          task: true;
        };
      }>
    | undefined;
}) {
  const os = capture?.task ? capture.task.os : "none";
  const taskDescription = capture?.task?.description ?? "";
  // In review, the viewer is a reviewer, not the worker who recorded it.
  // Their own device preference must never fill in the worker's device.
  const prefillFromProfile = capture?.status !== CaptureStatus.REVIEWING;

  return (
    <div className="flex h-full w-full">
      <div className="flex h-full w-2/3 overflow-auto border-r border-neutral-200 dark:border-neutral-800">
        <SaveTraceGallery />
      </div>
      <div className="sticky top-0 flex h-full w-1/3 shrink-0 grow-0 flex-col items-center justify-center p-8">
        <SaveTracePanel
          os={os}
          taskDescription={taskDescription}
          prefillFromProfile={prefillFromProfile}
        />
      </div>
    </div>
  );
}
