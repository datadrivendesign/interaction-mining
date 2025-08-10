"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DraftTraceFormData, TraceFormData } from "../edit/components/types";
import { useCapture } from "@/lib/hooks/capture";
import { ReviewPanel } from "./review-panel";
import { ReviewGallery } from "./review-gallery";
import { getDraftFiles } from "../edit/util";

export default function EvaluationClient({ isAdmin }: { isAdmin: boolean }) {
  const params = useParams();
  const captureId = params.captureId as string;
  const [traceData, setTraceData] = useState<TraceFormData>();
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });
  const router = useRouter();

  useEffect(() => {
    const fetchDraftFiles = async () => {
      const files = await getDraftFiles(captureId);
      if (!files.ok) {
        console.error("Failed to fetch files");
        return;
      }
      if (files.data.length === 0) {
        console.error("No draft files found");
        return;
      }
      const latestDraftFile = files.data[files.data.length - 1];
      const draftFileUrl = latestDraftFile.fileUrl;
      const draftFileResponse = await fetch(draftFileUrl);
      const draftFormData: DraftTraceFormData = await draftFileResponse.json();
      const screens = draftFormData.screens.map((s) => {
        return { id: s.id, src: "", timestamp: s.timestamp };
      });
      const vhs = draftFormData.screens
        .map((s) => {
          return { [s.id]: {} };
        })
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});
      const gestures = draftFormData.gestures;
      const redactions = draftFormData.redactions;
      const description = draftFormData.description;
      setTraceData({ screens, vhs, gestures, redactions, description });
    };
    fetchDraftFiles();
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
                setTraceData={setTraceData}
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
