"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { getCaptureFiles } from "@/lib/actions";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScreenReviewData, TraceFormData } from "../edit/components/types";
import { useCapture } from "@/lib/hooks/capture";
import { ReviewPanel } from "./review-panel";
import { ReviewGallery } from "./review-gallery";

export default function EvaluationClient({ isAdmin }: { isAdmin: boolean }) {
  const params = useParams();
  const captureId = params.captureId as string;
  const [traceData, setTraceData] = useState<TraceFormData>();
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });
  const router = useRouter();

  useEffect(() => {
    const fetchFiles = async () => {
      const files = await getCaptureFiles(captureId);
      if (!files.ok) {
        console.error("Failed to fetch files");
        return;
      }
      const fetchedScreenFiles = files.data.filter((file) =>
        file.fileKey.includes(`${captureId}/screens`)
      );

      fetchedScreenFiles.forEach((f) => console.log(f.fileUrl));
      // grab json file from the fileKey
      const screenData: ScreenReviewData[] = await Promise.all(
        fetchedScreenFiles.map(async (file) => {
          const response = await fetch(file.fileUrl);
          const data = await response.json();
          return data;
        })
      );
      console.log("screenData", screenData);
      const screens = screenData.map((s) => {
        return { id: s.id, src: s.src, timestamp: s.timestamp };
      });
      const vhs = screenData
        .map((s) => {
          return s.vh ? { [s.id]: s.vh } : {};
        })
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});
      const gestures = screenData
        .map((s) => {
          return { [s.id]: s.gesture };
        })
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});
      console.log("gestures", gestures);
      const redactions = screenData
        .map((s) => {
          return { [s.id]: s.redactions };
        })
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});
      const description = screenData[0].description;
      setTraceData({ screens, vhs, gestures, redactions, description });
    };
    fetchFiles();
  }, [captureId]);

  return (
    <main className="relative w-full h-[calc(100dvh-64px)] flex flex-grow">
      {!isTraceLoading && (
        <ResizablePanelGroup direction="horizontal" className="w-full h-full">
          <ResizablePanel
            defaultSize={25}
            minSize={25}
            maxSize={30}
            className="bg-neutral-50 dark:bg-neutral-950 box-border w-full h-full"
          >
            {traceData && capture && (
              <ReviewPanel
                traceData={traceData}
                capture={capture}
                router={router}
                isAdmin={isAdmin}
              />
            )}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={75}
            minSize={70}
            maxSize={75}
            className="bg-neutral-50 dark:bg-neutral-950 box-border w-full h-full"
          >
            {traceData && <ReviewGallery traceData={traceData} />}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </main>
  );
}
