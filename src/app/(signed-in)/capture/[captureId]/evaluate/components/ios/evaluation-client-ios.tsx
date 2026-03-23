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
import {
  ScreenComment,
  ScreenCommentsPanel,
} from "../shared/screen-comments-panel";

export function EvaluationClientIOS({ isAdmin }: { isAdmin: boolean }) {
  const params = useParams();
  const captureId = params.captureId as string;
  const [traceData, setTraceData] = useState<TraceFormData>();
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [commentsByScreen, setCommentsByScreen] = useState<
    Record<string, ScreenComment[]>
  >({});
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const isProcessingRef = useRef(false);

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

  const populateDraftScreens = useCallback(
    async (video: HTMLVideoElement, screens: FrameData[]) => {
      const frames: FrameData[] = [];
      try {
        const screensCopy = screens.map((screen) => ({ ...screen }));
        await extractVideoFrame(video, 0.1);
        for (const s of screensCopy) {
          if (!s.src) {
            const f = await extractVideoFrame(video, s.timestamp);
            s.src = f.src;
          }
          frames.push(s);
        }
      } catch (error) {
        console.error(`Error extracting video frames: ${error}`);
      }
      return frames;
    },
    [],
  );

  useEffect(() => {
    if (!capture || !traceData) {
      return;
    }

    const loadVideoAndPopulateScreens = async () => {
      if (isProcessingRef.current) {
        return;
      }
      try {
        isProcessingRef.current = true;
        const videoFiles = await fetchVideoFile(`uploads/${capture.id}`);
        if (videoFiles.length === 0 || !videoRef.current) {
          return;
        }
        const video = videoRef.current;
        video.src = videoFiles[0].fileUrl;
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video load timeout"));
          }, 30000);

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
          if (video.readyState >= 2) {
            onLoadedData();
          }
        });
        if (traceData.screens.filter((s) => s.src.length === 0).length === 0) {
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
        latestDraftFile.fileKey,
      );
      if (!signedLatestDraftFileRes.ok) {
        console.error("Failed to generate signed URL");
        return;
      }
      const draftFileResponse = await fetch(
        signedLatestDraftFileRes.data.signedUrl,
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
      const sortedScreens = screens.sort((a, b) => a.timestamp - b.timestamp);
      setTraceData({
        screens: sortedScreens,
        vhs,
        gestures,
        redactions,
        description,
        iOSVersion,
        iPhoneVersion,
      });
      setActiveScreenId(sortedScreens[0]?.id ?? null);
      setCommentsByScreen({});
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
          {/* Left: Video + Feedback + Approve/Deny */}
          <ResizablePanel
            defaultSize={isCompactLayout ? 38 : 25}
            minSize={isCompactLayout ? 28 : 25}
            maxSize={isCompactLayout ? 55 : 30}
            className="min-h-0 bg-neutral-50 dark:bg-neutral-950 box-border w-full h-full overflow-hidden flex flex-col"
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

          {/* Right: Gallery + Screen Comments (nested horizontal split) */}
          <ResizablePanel
            defaultSize={isCompactLayout ? 62 : 75}
            minSize={isCompactLayout ? 45 : 65}
            maxSize={isCompactLayout ? 72 : 80}
            className="min-h-0 box-border w-full h-full"
          >
            <ResizablePanelGroup
              direction="horizontal"
              className="w-full h-full"
            >
              {/* Gallery — left/center */}
              <ResizablePanel
                defaultSize={70}
                minSize={50}
                maxSize={85}
                className="min-h-0 overflow-y-auto bg-neutral-50 dark:bg-neutral-950"
              >
                {traceData && (
                  <ReviewGalleryIOS
                    traceData={traceData}
                    videoRef={videoRef}
                    activeScreenId={activeScreenId}
                    commentsByScreen={commentsByScreen}
                    onScreenSelect={setActiveScreenId}
                  />
                )}
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Screen Comments Panel — right */}
              <ResizablePanel
                defaultSize={30}
                minSize={20}
                maxSize={45}
                className="min-h-0 overflow-hidden"
              >
                {traceData && (
                  <ScreenCommentsPanel
                    screens={traceData.screens}
                    activeScreenId={activeScreenId}
                    commentsByScreen={commentsByScreen}
                    onCommentsChange={setCommentsByScreen}
                  />
                )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </main>
  );
}
