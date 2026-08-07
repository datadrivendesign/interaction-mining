import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ListedFiles } from "@/lib/actions";
import { UseFormSetValue } from "react-hook-form";
import { FrameData, TraceFormData } from "../../../types";
import { DraftFetchResults } from "../../../../util";
import { extractThumbnails } from "../../util";
import { logScrubEvent, recordPhase } from "./scrub-profiler";
import {
  MAX_TIMELINE_THUMBS,
  PREVIEW_THUMB_HEIGHT,
  PREVIEW_THUMB_JPEG_QUALITY,
  PreviewThumbnail,
  TIMELINE_THUMB_HEIGHT,
  TIMELINE_THUMB_JPEG_QUALITY,
  VIDEO_LOAD_TIMEOUT_MS,
  revokeBlobUrls,
} from "./ios-helpers";

interface UseIosVideoBootstrapArgs {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoFiles: ListedFiles[];
  draftFetchResult: DraftFetchResults;
  screens: FrameData[];
  setValue: UseFormSetValue<TraceFormData>;
  onResetPreviewFrames: () => void;
  /**
   * Called once for every newly extracted screen `blob:` URL. The route-level
   * ScreenBlobRegistryProvider uses this to revoke the URL when it eventually
   * leaves form state.
   */
  registerScreenUrl: (url: string) => void;
  /**
   * Reads a frame out of the recording, waiting for the picture to reach the
   * surface canvas samples rather than reading the moment the seek reports
   * done — which yields the previous frame under the new timestamp.
   *
   * This seeks the displayed element, which is why `isVideoReady` exists.
   */
  extractFrameAt: (
    time: number,
    options?: { mimeType?: "image/png" | "image/jpeg"; output?: "data-url" | "object-url"; preferOffscreenCanvas?: boolean },
  ) => Promise<FrameData | null>;
}

interface UseIosVideoBootstrapResult {
  videoDuration: number;
  thumbnails: PreviewThumbnail[];
  previewThumbnails: PreviewThumbnail[];
  /**
   * False until this hook has finished with the video element. Bootstrap seeks
   * the live element while extracting frames, so anything that wants to place
   * the playhead has to wait for this — a seek performed earlier gets dragged
   * away by the warmup extraction.
   */
  isVideoReady: boolean;
}

export function useIosVideoBootstrap({
  videoRef,
  videoFiles,
  draftFetchResult,
  screens,
  setValue,
  onResetPreviewFrames,
  registerScreenUrl,
  extractFrameAt,
}: UseIosVideoBootstrapArgs): UseIosVideoBootstrapResult {
  const screensRef = useRef<FrameData[]>(screens);
  const thumbnailObjectUrlsRef = useRef<string[]>([]);
  const previewThumbnailObjectUrlsRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  /**
   * Identifies the current bootstrap run, so work deferred past the interactive
   * phase can tell whether it is still wanted.
   */
  const bootstrapRunIdRef = useRef(0);

  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [thumbnails, setThumbnails] = useState<PreviewThumbnail[]>([]);
  const [previewThumbnails, setPreviewThumbnails] = useState<PreviewThumbnail[]>(
    [],
  );

  // Thumbnail URLs are owned solely by this component (the FrameTimeline) and
  // can be safely revoked when we unmount. Extracted screen blob URLs are
  // intentionally NOT tracked or revoked here: they're handed off to form state
  // and consumed by the redact phase, so we let them outlive this component.
  // Lifecycle responsibility for screen URLs sits at the form/route level.
  const revokeThumbnailUrls = useCallback(() => {
    revokeBlobUrls(thumbnailObjectUrlsRef.current);
    revokeBlobUrls(previewThumbnailObjectUrlsRef.current);
  }, []);

  // Keep screensRef in sync so the bootstrap async closure can read fresh data.
  useEffect(() => {
    screensRef.current = screens;
  }, [screens]);

  // Bootstrap effect: load the video, extract thumbnails + preview thumbnails,
  // and populate any screens missing a frame image.
  useEffect(() => {
    const runId = bootstrapRunIdRef.current;
    const loadVideoAndPopulate = async () => {
      if (isProcessingRef.current) {
        return;
      }
      if (videoFiles.length === 0 || !videoRef.current) {
        return;
      }
      if (draftFetchResult === DraftFetchResults.LOADING) {
        return;
      }
      const bootstrapStartedAt = performance.now();
      // Captured for the deferred phase below, which runs outside the try block.
      let video: HTMLVideoElement;
      let duration: number;
      try {
        isProcessingRef.current = true;
        setIsVideoReady(false);
        revokeBlobUrls(thumbnailObjectUrlsRef.current);
        revokeBlobUrls(previewThumbnailObjectUrlsRef.current);
        thumbnailObjectUrlsRef.current = [];
        previewThumbnailObjectUrlsRef.current = [];
        setThumbnails([]);
        setPreviewThumbnails([]);
        onResetPreviewFrames();
        video = videoRef.current;
        video.src = videoFiles[0].fileUrl;
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Video load timeout"));
          }, VIDEO_LOAD_TIMEOUT_MS);

          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            setVideoDuration(video.duration);
            resolve();
          };

          const onError = (e: any) => {
            clearTimeout(timeout);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            reject(e);
          };

          video.addEventListener("loadedmetadata", onLoadedMetadata, {
            once: true,
          });
          video.addEventListener("error", onError, { once: true });
          if (video.readyState >= 2 && video.duration > 0) {
            onLoadedMetadata();
          }
        });
        if (video.duration === 0) {
          throw new Error("Video duration not available");
        }
        duration = video.duration;
        const timelineThumbsStartedAt = performance.now();
        const thumbs = await extractThumbnails(
          video,
          video.duration,
          MAX_TIMELINE_THUMBS,
          TIMELINE_THUMB_HEIGHT,
          {
            mimeType: "image/jpeg",
            quality: TIMELINE_THUMB_JPEG_QUALITY,
            output: "object-url",
            preferOffscreenCanvas: true,
          },
        );
        recordPhase("timelineThumbnails", performance.now() - timelineThumbsStartedAt);
        thumbnailObjectUrlsRef.current = thumbs
          .map((thumb) => thumb.src)
          .filter((src) => src.startsWith("blob:"));
        setThumbnails(thumbs);
        const screensSnapshot = screensRef.current.map((screen) => ({
          ...screen,
        }));
        const draftScreens: FrameData[] = [];

        try {
          for (const screen of screensSnapshot) {
            if (!screen.src) {
              const frame = await extractFrameAt(screen.timestamp, {
                mimeType: "image/png",
                output: "object-url",
                preferOffscreenCanvas: true,
              });
              if (frame) {
                screen.src = frame.src;
                registerScreenUrl(frame.src);
              }
            }
            draftScreens.push(screen);
          }
        } catch (error) {
          console.error(`Error extracting video frames: ${error}`);
        }

        setValue(
          "screens",
          draftScreens.sort((a, b) => a.timestamp - b.timestamp),
        );
        recordPhase("bootstrapTotal", performance.now() - bootstrapStartedAt);
        // Done seeking the live element. Anything holding a playhead position
        // can place it now without bootstrap dragging it away.
        setIsVideoReady(true);
      } catch (e) {
        console.error("Error loading video blob:", e);
        toast.error("Error loading video for frame extraction");
        return;
      } finally {
        isProcessingRef.current = false;
      }

      // Scrub-preview thumbnails, deliberately after the step is interactive.
      //
      // Nothing on screen needs them: with an empty grid the preview overlay
      // never renders and scrubbing falls through to real video frames, which
      // measured at 14-38ms median across Chrome and Safari. Blocking on this
      // was between a third and a half of the wait to enter the step.
      //
      // Extraction runs on its own cloned element, so it cannot disturb the
      // playhead — but it does compete for decode bandwidth, so seeks in the
      // first seconds may be slower than once it has finished.
      if (bootstrapRunIdRef.current !== runId) {
        return;
      }
      try {
        logScrubEvent("previewThumbnailsStarted", {});
        const previewThumbsStartedAt = performance.now();
        const largePreviewThumbs = await extractThumbnails(
          video,
          duration,
          Math.min(90, Math.max(52, Math.ceil(duration))),
          PREVIEW_THUMB_HEIGHT,
          {
            mimeType: "image/jpeg",
            quality: PREVIEW_THUMB_JPEG_QUALITY,
            output: "object-url",
            preferOffscreenCanvas: true,
          },
        );
        // The worker may have left the step while this ran. Its blob URLs are
        // not in the ref yet, so the unmount sweep cannot see them.
        if (bootstrapRunIdRef.current !== runId) {
          revokeBlobUrls(largePreviewThumbs.map((thumb) => thumb.src));
          return;
        }
        recordPhase(
          "previewThumbnails",
          performance.now() - previewThumbsStartedAt,
        );
        recordPhase("previewThumbnailCount", largePreviewThumbs.length);
        previewThumbnailObjectUrlsRef.current = largePreviewThumbs
          .map((thumb) => thumb.src)
          .filter((src) => src.startsWith("blob:"));
        setPreviewThumbnails(largePreviewThumbs);
      } catch (error) {
        // Not fatal — the settled frame is extracted separately — but it does
        // cost the worker every preview during a drag, so it says so loudly
        // rather than leaving an empty grid to be inferred from behaviour.
        logScrubEvent("previewThumbnailsFailed", {
          reason: String(error).slice(0, 80),
        });
        console.error(`Error extracting scrub preview thumbnails: ${error}`);
        toast.error("Scrub previews unavailable for this recording");
      }
    };
    loadVideoAndPopulate();
    return () => {
      // Invalidate the run so deferred extraction stops and cleans up after
      // itself if the worker leaves the step.
      bootstrapRunIdRef.current += 1;
    };
  }, [
    draftFetchResult,
    extractFrameAt,
    onResetPreviewFrames,
    registerScreenUrl,
    setValue,
    videoFiles,
    videoRef,
  ]);

  // Revoke ephemeral (thumbnail) blob URLs on unmount. Screen URLs are not
  // tracked here and intentionally outlive the component.
  useEffect(() => {
    return () => {
      revokeThumbnailUrls();
    };
  }, [revokeThumbnailUrls]);

  return {
    videoDuration,
    thumbnails,
    previewThumbnails,
    isVideoReady,
  };
}
