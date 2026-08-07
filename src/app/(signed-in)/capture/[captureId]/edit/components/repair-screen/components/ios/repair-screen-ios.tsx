import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Filmstrip } from "../filmstrip";
import FrameTimeline from "./extract-frames-timeline";
import { useHotkeys } from "react-hotkeys-hook";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { extractVideoFrame, useFormFieldKeyPressGuard } from "../../util";
import { FrameData, Redaction, TraceFormData } from "../../../types";
import { ListedFiles } from "@/lib/actions";
import { ScreenGesture } from "@prisma/client";
import { useFormContext, useWatch } from "react-hook-form";
import { useNavigation } from "../../repair-screen";
import { Platform } from "@/lib/utils";
import { DraftFetchResults } from "../../../../util";
import { RepairVideoPanelIOS } from "./repair-video-panel-ios";
import { RepairFocusPanelIOS } from "./repair-focus-panel-ios";
import { useIosScreenFocusSync } from "./use-ios-screen-focus-sync";
import { useIosVideoPlayback } from "./use-ios-video-playback";
import { useIosScrubPreview } from "./use-ios-scrub-preview";
import { useIosStepHotkeys } from "./use-ios-step-hotkeys";
import { useIosVideoBootstrap } from "./use-ios-video-bootstrap";
import { useIosFrameReader } from "./use-ios-frame-reader";
import { toast } from "sonner";
import { useScreenBlobRegistry } from "../../../../screen-blob-registry";

export function RepairScreenIOS({
  taskDescription,
  files,
  os,
  draftFetchResult,
}: {
  taskDescription: string | undefined;
  files: ListedFiles[];
  os: Platform;
  draftFetchResult: DraftFetchResults;
}) {
  const { focusedScreenId, selectScreen, focusedIndex, playheadRequest } =
    useNavigation();
  const { setValue } = useFormContext<TraceFormData>();
  const { register: registerScreenUrl } = useScreenBlobRegistry();
  const [watchScreens, watchGestures, watchRedactions] = useWatch({
    name: ["screens", "gestures", "redactions"],
  });

  const screens = watchScreens as FrameData[];
  const gestures = watchGestures as { [key: string]: ScreenGesture };
  const redactions = watchRedactions as { [key: string]: Redaction[] };
  const focusedScreen =
    screens.find((screen) => screen.id === focusedScreenId) ?? null;
  const captureMarkers = useMemo(
    () =>
      screens.map((screen) => ({
        id: screen.id,
        timestamp: screen.timestamp,
        isFocused: screen.id === focusedScreenId,
      })),
    [focusedScreenId, screens],
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const didKeyPressStartInFormField = useFormFieldKeyPressGuard();
  // Highest playhead request already applied, so each is placed once.
  const appliedPlayheadNonceRef = useRef<number | null>(null);

  const videoFiles = useMemo(() => {
    const regexRule = /\.(mp4|mov)$/;
    // iOS screen recordings capitalize file extension, so we lowercase here
    return files.filter((f) => regexRule.test(f.fileKey.toLowerCase()));
  }, [files]);

  const { extractFrameAt } = useIosFrameReader(videoRef);

  // Stable cross-hook callbacks bound to refs. Initial values are no-ops; the
  // refs are wired to the real implementations once downstream hooks initialize.
  const onResetPreviewFramesRef = useRef<() => void>(() => {});
  const onLivePhotoStartRef = useRef<() => void>(() => {});
  const onResetPreviewFrames = useCallback(
    () => onResetPreviewFramesRef.current(),
    [],
  );
  const onLivePhotoStart = useCallback(
    () => onLivePhotoStartRef.current(),
    [],
  );

  const { syncFocusToTimestamp } = useIosScreenFocusSync({
    screens,
    focusedScreenId,
    selectScreen,
  });

  // Bootstrap: load video, populate screens, expose duration + thumbnails.
  const { videoDuration, thumbnails, previewThumbnails, isVideoReady } =
    useIosVideoBootstrap({
      videoRef,
      videoFiles,
      draftFetchResult,
      screens,
      setValue,
      onResetPreviewFrames,
      registerScreenUrl,
      extractFrameAt,
    });

  // Playback: isPlaying, currentTime, live-photo replay window.
  const {
    currentTime,
    currentTimeRef,
    isPlaying,
    setIsPlaying,
    isLivePhotoActive,
    setIsLivePhotoActive,
    livePhotoEndRef,
    updateCurrentTime,
    handlePlayPause,
    handleLivePhoto,
  } = useIosVideoPlayback({
    videoRef,
    videoDuration,
    focusedScreenId,
    onLivePhotoStart,
  });

  // Scrub-preview: scrub state, seek queue, throttling, commit, preview swap.
  const {
    setPausedPreviewTime,
    displayedPreviewFrameSrc,
    incomingPreviewFrameSrc,
    isIncomingPreviewVisible,
    displayedTimelineTime,
    hasPreviewOverlay,
    scrubPreviewTimeRef,
    handleSetTime,
    handleScrubPreviewTimeChange,
    handleScrubActiveChange,
    handleScrubCommit,
    handleIncomingPreviewLoad,
    scheduleScrubDisplayTime,
    scheduleScrubSeek,
    resetPreviewFrames,
  } = useIosScrubPreview({
    videoRef,
    videoDuration,
    isPlaying,
    previewThumbnails,
    currentTime,
    updateCurrentTime,
    livePhotoEndRef,
    setIsLivePhotoActive,
    syncFocusToTimestamp,
  });

  // Reconcile the recording towards where it has been asked to sit.
  //
  // Declarative on purpose. Bootstrap seeks the live element while extracting
  // frames — the warmup grab alone drags it to 0.1s — so a seek issued during
  // loading gets undone. Expressing the target as state means this effect simply
  // runs again once `isVideoReady` flips, instead of a queue trying to guess the
  // right moment to fire.
  //
  // No focus sync: the request came *from* a selection, and re-deriving focus
  // from the landed timestamp is what let a click settle on a neighbouring
  // screen when two sit close together.
  useEffect(() => {
    if (!playheadRequest || !isVideoReady) {
      return;
    }
    if (appliedPlayheadNonceRef.current === playheadRequest.nonce) {
      return;
    }
    appliedPlayheadNonceRef.current = playheadRequest.nonce;
    handleSetTime(playheadRequest.time);
  }, [handleSetTime, isVideoReady, playheadRequest]);

  // Now that scrub-preview exists, point the lazy refs at the real callbacks.
  useEffect(() => {
    onResetPreviewFramesRef.current = resetPreviewFrames;
  }, [resetPreviewFrames]);
  useEffect(() => {
    onLivePhotoStartRef.current = () => setPausedPreviewTime(null);
  }, [setPausedPreviewTime]);

  // Frame-stepping (`,` / `.`) hotkeys.
  useIosStepHotkeys({
    videoDuration,
    currentTimeRef,
    scrubPreviewTimeRef,
    scheduleScrubDisplayTime,
    scheduleScrubSeek,
    handleScrubCommit,
    setPausedPreviewTime,
    onScrubActiveChange: handleScrubActiveChange,
  });

  const handleCaptureFrame = useCallback(async () => {
    // Read from the offscreen copy, never the displayed element. Safari returns
    // black or a stale frame from a composited video, which was writing images
    // into traces that carried the right timestamp and the wrong picture.
    const f = await extractFrameAt(currentTime, {
      mimeType: "image/png",
      output: "object-url",
      preferOffscreenCanvas: true,
    });
    if (!f) {
      toast.error("Could not capture this frame. Try again.");
      return;
    }
    registerScreenUrl(f.src);
    setValue(
      "screens",
      [...screens, f].sort((a, b) => a.timestamp - b.timestamp),
    );
    // Focus what was just captured. Every screen but the last needs a gesture,
    // so capturing is always followed by annotating it — and leaving focus
    // behind meant hunting for the new frame in the filmstrip first. No seek is
    // needed: the playhead is already at this screen's timestamp.
    selectScreen(f.id, "capture");
  }, [
    currentTime,
    extractFrameAt,
    registerScreenUrl,
    screens,
    selectScreen,
    setValue,
  ]);

  // Workspace keybinds
  useHotkeys("space", async (e) => {
    e.preventDefault();
    await handlePlayPause();
  });

  useHotkeys("k", async (e) => {
    e.preventDefault();
    await handlePlayPause();
  });

  useHotkeys(
    "r",
    (e) => {
      e.preventDefault();
      if (!focusedScreen) return;
      handleLivePhoto(focusedScreen.timestamp);
    },
    [focusedScreen, handleLivePhoto],
  );

  useHotkeys(
    "j",
    (e) => {
      e.preventDefault();
      handleSetTime(currentTime - 5, { syncFocus: true });
    },
    [currentTime, handleSetTime],
  );

  useHotkeys(
    "l",
    (e) => {
      e.preventDefault();
      handleSetTime(currentTime + 5, { syncFocus: true });
    },
    [currentTime, handleSetTime],
  );

  useHotkeys(
    "c",
    (e) => {
      // Bound to keyup, so the release can outlive the field it was typed into:
      // if a form write moved the focused screen mid-press, the annotation
      // editor is already gone and this event reads as a bare workspace
      // keypress. Trust the keydown's target instead.
      if (didKeyPressStartInFormField("c")) {
        return;
      }
      e.preventDefault();
      handleCaptureFrame();
    },
    { keyup: true },
    [didKeyPressStartInFormField, handleCaptureFrame],
  );

  return (
    <div className="flex flex-col w-full h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel
          defaultSize={67}
          minSize={50}
          maxSize={67}
          className="relative z-20 overflow-visible"
        >
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
              defaultSize={33}
              minSize={33}
              maxSize={50}
              className="flex flex-col justify-center items-center h-full min-h-0 p-4 md:p-6 bg-neutral-50 dark:bg-neutral-950 box-border"
            >
              <RepairVideoPanelIOS
                videoRef={videoRef}
                displayedPreviewFrameSrc={displayedPreviewFrameSrc}
                incomingPreviewFrameSrc={incomingPreviewFrameSrc}
                isIncomingPreviewVisible={isIncomingPreviewVisible}
                hasPreviewOverlay={hasPreviewOverlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onIncomingPreviewLoad={handleIncomingPreviewLoad}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={67}
              minSize={50}
              maxSize={67}
              className="relative z-20 min-h-0 h-full overflow-visible"
            >
              <RepairFocusPanelIOS
                taskDescription={taskDescription}
                focusedScreen={focusedScreen}
                isLastScreen={focusedIndex === screens.length - 1}
                isLivePhotoActive={isLivePhotoActive}
                onLivePhoto={handleLivePhoto}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />
        <ResizablePanel
          defaultSize={30}
          minSize={30}
          maxSize={50}
          className="relative z-10"
        >
          <div className="flex flex-col h-full">
            <Filmstrip
              screens={screens}
              gestures={gestures}
              redactions={redactions}
              os={os}
            />
            <FrameTimeline
              thumbnails={thumbnails}
              currentTime={displayedTimelineTime}
              videoDuration={videoDuration}
              isPlaying={isPlaying}
              captureMarkers={captureMarkers}
              handleSetTime={handleSetTime}
              handlePlayPause={handlePlayPause}
              handleCapture={handleCaptureFrame}
              onScrubPreviewTimeChange={handleScrubPreviewTimeChange}
              onScrubActiveChange={handleScrubActiveChange}
              onScrubCommit={handleScrubCommit}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
