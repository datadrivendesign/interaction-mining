"use client";

import { CaptureStatus, Prisma } from "@prisma/client";
import { SaveTraceGallery } from "./components/save-trace-gallery";
import { SaveTracePanel } from "./components/save-trace-panel";
import { SelfCheck, SelfCheckState } from "./components/self-check";

export default function Review({
  capture,
  selfCheck,
}: {
  capture:
    | Prisma.CaptureGetPayload<{
        include: {
          app: true;
          task: true;
        };
      }>
    | undefined;
  /** The worker's checks before Finish; absent for staff. */
  selfCheck?: SelfCheckState;
}) {
  const os = capture?.task ? capture.task.os : "none";
  const taskDescription = capture?.task?.description ?? "";
  // In review, the viewer is a reviewer, not the worker who recorded it.
  // Their own device preference must never fill in the worker's device.
  // Staff editing someone else's capture must not write their own device.
  const prefillFromProfile =
    capture?.status !== CaptureStatus.REVIEWING &&
    capture?.status !== CaptureStatus.REVIEWED;

  return (
    <div className="flex h-full w-full">
      <div className="flex h-full w-2/3 overflow-auto border-r border-neutral-200 dark:border-neutral-800">
        <SaveTraceGallery os={os} />
      </div>
      <div className="sticky top-0 flex h-full w-1/3 shrink-0 grow-0 flex-col items-center justify-center-safe overflow-y-auto p-8">
        <SaveTracePanel
          os={os}
          taskDescription={taskDescription}
          prefillFromProfile={prefillFromProfile}
        />
        {selfCheck && <SelfCheck {...selfCheck} />}
      </div>
    </div>
  );
}
