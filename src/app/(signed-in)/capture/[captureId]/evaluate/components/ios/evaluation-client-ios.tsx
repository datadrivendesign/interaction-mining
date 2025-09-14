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
import { ReviewPanelIOS } from "./review-panel-ios";
import { ReviewGalleryIOS } from "./review-gallery-ios";
import { getDraftFiles } from "../../../edit/util";
import { generateSignedCloudFrontURL } from "@/lib/aws/s3/server";
import { extractVideoFrame } from "../../../edit/components/repair-screen/util/ios-video-operations";
import { fetchVideoFile } from "../../utils/file-fetch";

export function EvaluationClientIOS({ isAdmin }: { isAdmin: boolean }) {
  const params = useParams();
  const captureId = params.captureId as string;
  const [traceData, setTraceData] = useState<TraceFormData>();
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const isProcessingRef = useRef(false);

  const populateDraftScreens = useCallback(
    async (video: HTMLVideoElement, screens: FrameData[]) => {
      const frames: FrameData[] = [];
      try {
        // Create a copy of screens to avoid mutation issues
        const screensCopy = screens.map((screen) => ({ ...screen }));
        // Before the loop, do a "warm-up" seek to ensure video is loaded:
        await extractVideoFrame(video, 0.1);
        for (const s of screensCopy) {
          if (!s.src) {
            const f = await extractVideoFrame(video, s.timestamp);
            s.src = f.src; // Safe to mutate the copy
          }
          frames.push(s);
        }
      } catch (error) {
        console.error(`Error extracting video frames: ${error}`);
      }
      return frames;
    },
    []
  );

  useEffect(() => {
    if (!capture || !traceData) {
      return;
    }

    const loadVideoAndPopulateScreens = async () => {
      if (isProcessingRef.current) {
        // video is already being processed
        return;
      }
      try {
        // start load video
        isProcessingRef.current = true;
        const videoFiles = await fetchVideoFile(`uploads/${capture.id}`);
        if (videoFiles.length === 0 || !videoRef.current) {
          // video files not found or video ref not found
          return;
        }
        const video = videoRef.current;
        video.src = videoFiles[0].fileUrl;
        // wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video load timeout"));
          }, 30000); // 30 second timeout

          const onLoadedData = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("error", onError);
            resolve();
          };

          const onError = (e: any) => {
            clearTimeout(timeout);
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("error", onError);
            reject(e);
          };

          video.addEventListener("loadeddata", onLoadedData, { once: true });
          video.addEventListener("error", onError, { once: true });
          // Check if already loaded
          if (video.readyState >= 2) {
            onLoadedData();
          }
        });
        // check if need to populate data
        if (traceData.screens.filter((s) => s.src.length === 0).length === 0) {
          // All screens already have src, skip frame extraction
          return;
        }
        const frames = await populateDraftScreens(video, traceData.screens);
        setTraceData((prevData) => {
          if (!prevData) {
            return prevData;
          }
          return {
            ...prevData,
            screens: frames.sort((a, b) => a.timestamp - b.timestamp),
          };
        });
      } catch (error) {
        console.error(`Error loading video: ${error}`);
      } finally {
        isProcessingRef.current = false;
      }
    };

    loadVideoAndPopulateScreens();
  }, [capture?.id, traceData?.screens, populateDraftScreens]);

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
        <ResizablePanelGroup direction="horizontal" className="w-full h-full">
          <ResizablePanel
            defaultSize={25}
            minSize={25}
            maxSize={30}
            className="bg-neutral-50 dark:bg-neutral-950 box-border w-full h-full"
          >
            {traceData && capture && (
              <ReviewPanelIOS
                traceData={traceData}
                capture={capture}
                isAdmin={isAdmin}
                videoRef={videoRef}
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
            {traceData && (
              <ReviewGalleryIOS traceData={traceData} videoRef={videoRef} />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </main>
  );
}
