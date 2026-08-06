import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ListedFiles } from "@/lib/actions";
import { UseFormSetValue } from "react-hook-form";
import { FrameData, TraceFormData } from "../../../types";
import { DraftFetchResults } from "../../../../util";
import { extractThumbnails, extractVideoFrame } from "../../util";
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
}: UseIosVideoBootstrapArgs): UseIosVideoBootstrapResult {
  const screensRef = useRef<FrameData[]>(screens);
  const thumbnailObjectUrlsRef = useRef<string[]>([]);
  const previewThumbnailObjectUrlsRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

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
        const video = videoRef.current;
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
        thumbnailObjectUrlsRef.current = thumbs
          .map((thumb) => thumb.src)
          .filter((src) => src.startsWith("blob:"));
        setThumbnails(thumbs);
        const largePreviewThumbs = await extractThumbnails(
          video,
          video.duration,
          Math.min(90, Math.max(52, Math.ceil(video.duration))),
          PREVIEW_THUMB_HEIGHT,
          {
            mimeType: "image/jpeg",
            quality: PREVIEW_THUMB_JPEG_QUALITY,
            output: "object-url",
            preferOffscreenCanvas: true,
          },
        );
        previewThumbnailObjectUrlsRef.current = largePreviewThumbs
          .map((thumb) => thumb.src)
          .filter((src) => src.startsWith("blob:"));
        setPreviewThumbnails(largePreviewThumbs);
        const screensSnapshot = screensRef.current.map((screen) => ({
          ...screen,
        }));
        const draftScreens: FrameData[] = [];

        try {
          // Warm the video decoder once before extracting any missing frames.
          const warmupFrame = await extractVideoFrame(video, 0.1, {
            mimeType: "image/png",
            output: "object-url",
            preferOffscreenCanvas: true,
          });
          if (warmupFrame.src.startsWith("blob:")) {
            URL.revokeObjectURL(warmupFrame.src);
          }
          for (const screen of screensSnapshot) {
            if (!screen.src) {
              const frame = await extractVideoFrame(video, screen.timestamp, {
                mimeType: "image/png",
                output: "object-url",
                preferOffscreenCanvas: true,
              });
              screen.src = frame.src;
              registerScreenUrl(frame.src);
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
        // Done seeking the live element. Anything holding a playhead position
        // can place it now without bootstrap dragging it away.
        setIsVideoReady(true);
      } catch (e) {
        console.error("Error loading video blob:", e);
        toast.error("Error loading video for frame extraction");
      } finally {
        isProcessingRef.current = false;
      }
    };
    loadVideoAndPopulate();
  }, [
    draftFetchResult,
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
