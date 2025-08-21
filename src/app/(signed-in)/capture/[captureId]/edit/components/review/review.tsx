"use client";

import { Prisma } from "@prisma/client";
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

  return (
    <div className="flex w-full h-full">
      <div className="flex w-2/3 h-full overflow-auto border-r border-neutral-200 dark:border-neutral-800">
        <SaveTraceGallery />
      </div>
      <div className="sticky top-0 flex flex-col shrink-0 grow-0 justify-center items-center w-1/3 h-full p-8">
        <SaveTracePanel os={os} />
      </div>
    </div>
  );
}
