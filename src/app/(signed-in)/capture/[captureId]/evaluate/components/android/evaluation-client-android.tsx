"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DraftTraceFormData,
  FrameData,
  TraceFormData,
} from "../../../edit/components/types";
import { useCapture } from "@/lib/hooks/capture";
import { ReviewPanelAndroid } from "./review-panel-android";
import { ReviewGalleryAndroid } from "./review-gallery-android";
import { getDraftFiles } from "../../../edit/util";
import { generateSignedCloudFrontURL } from "@/lib/aws/s3/server";
import { CaptureScreenFile, getCaptureFiles, ListedFiles } from "@/lib/actions";

export function EvaluationClientAndroid({ isAdmin }: { isAdmin: boolean }) {
  const params = useParams();
  const captureId = params.captureId as string;
  const [traceData, setTraceData] = useState<TraceFormData>();
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });
  const isProcessingRef = useRef(false);

  // populate frames from retrieved frames
  const populateDraftScreens = useCallback(
    async (
      files: ListedFiles[],
      traceData: TraceFormData
    ): Promise<{ screens: FrameData[]; vhs: { [key: string]: any } }> => {
      const screensCopy: FrameData[] = [];
      const vhsCopy: { [key: string]: any } = {};
      for (const screen of traceData.screens) {
        if (!screen.src) {
          const frame = files.find((f) => f.fileKey.includes(screen.id));
          if (frame) {
            const frameResponse = await fetch(frame.fileUrl);
            const frameJson: CaptureScreenFile = await frameResponse.json();
            screensCopy.push({
              ...screen,
              src: `data:image/png;base64,${frameJson.img}`.trim(),
            });
            vhsCopy[screen.id] = JSON.parse(frameJson.vh);
          }
        }
      }
      return {
        screens: screensCopy,
        vhs: vhsCopy,
      };
    },
    []
  );

  useEffect(() => {
    const updateLayoutMode = () => {
      setIsCompactLayout(window.innerWidth < 1024);
    };
    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);
    return () => {
      window.removeEventListener("resize", updateLayoutMode);
    };
  }, []);

  useEffect(() => {
    if (!capture || !traceData) {
      return;
    }

    const loadFramesAndPopulateCapture = async () => {
      if (isProcessingRef.current) {
        // video is already being processed
        return;
      }
      try {
        // start load video
        isProcessingRef.current = true;
        const captureFiles = await getCaptureFiles(captureId);
        if (!captureFiles.ok) {
          console.error("Failed to fetch capture files");
          return;
        }
        const regexRule =
          /(\d{4})-(\d{2})-(\d{2}) (\d{2})\:(\d{2})\:(\d{2})\.(\d{3})(.+)\.(json)$/;
        // iOS screen recordings capitalize file extension, so we lowercase here
        const frameFiles = captureFiles.data.filter((f) =>
          regexRule.test(f.fileName.toLowerCase())
        );
        console.log("frameFiles", frameFiles);
        // check if need to populate data
        if (
          traceData.screens.filter((s) => s.src.length === 0).length === 0 ||
          traceData.vhs?.length === 0
        ) {
          // All screens already have src, skip frame extraction
          return;
        }
        const { screens, vhs } = await populateDraftScreens(
          frameFiles,
          traceData
        );
        setTraceData((prevData) => {
          if (!prevData) {
            return prevData;
          }
          return {
            ...prevData,
            screens: screens.sort((a, b) => a.timestamp - b.timestamp),
            vhs: vhs,
          };
        });
      } catch (error) {
        console.error(`Error loading video: ${error}`);
      } finally {
        isProcessingRef.current = false;
      }
    };

    loadFramesAndPopulateCapture();
  }, [capture?.id, traceData?.screens, traceData?.vhs, populateDraftScreens]);

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
      // grab json file from the fileKey
      const regexFileVersionRule = /draft-(\d+)\.json$/;
      const draftFiles = files.data;
      files.data.sort((a, b) => {
        const versionA = a.fileKey.match(regexFileVersionRule);
        const versionB = b.fileKey.match(regexFileVersionRule);
        if (versionA && versionB) {
          return parseInt(versionA[1]) - parseInt(versionB[1]);
        }
        return 0;
      });
      const latestDraftFile = draftFiles[draftFiles.length - 1];
      const signedLatestDraftFileRes = await generateSignedCloudFrontURL(
        latestDraftFile.fileKey
      );
      if (!signedLatestDraftFileRes.ok) {
        console.error("Failed to generate signed URL");
        return;
      }
      const draftFileResponse = await fetch(
        signedLatestDraftFileRes.data.signedUrl
      );
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
      const iOSVersion = draftFormData.iOSVersion ?? undefined;
      const iPhoneVersion = draftFormData.iPhoneVersion ?? undefined;
      setTraceData({
        screens,
        vhs,
        gestures,
        redactions,
        description,
        iOSVersion,
        iPhoneVersion,
      });
    };
    fetchDraftFiles();
  }, [captureId]);

  return (
    <main className="relative w-full h-[calc(100dvh-64px)] flex flex-grow">
      {!isTraceLoading && (
        <ResizablePanelGroup
          direction={isCompactLayout ? "vertical" : "horizontal"}
          className="w-full h-full"
        >
          <ResizablePanel
            defaultSize={isCompactLayout ? 38 : 25}
            minSize={isCompactLayout ? 28 : 25}
            maxSize={isCompactLayout ? 55 : 30}
            className="min-h-0 bg-neutral-50 dark:bg-neutral-950 box-border w-full h-full overflow-hidden flex flex-col"
          >
            {traceData && capture && (
              <ReviewPanelAndroid
                traceData={traceData}
                capture={capture}
                isAdmin={isAdmin}
              />
            )}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={isCompactLayout ? 62 : 75}
            minSize={isCompactLayout ? 45 : 70}
            maxSize={isCompactLayout ? 72 : 75}
            className="bg-neutral-50 dark:bg-neutral-950 box-border w-full h-full"
          >
            {traceData && <ReviewGalleryAndroid traceData={traceData} />}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </main>
  );
}
