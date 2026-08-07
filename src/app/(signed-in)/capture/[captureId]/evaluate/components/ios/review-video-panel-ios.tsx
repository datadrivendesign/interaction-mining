"use client";

import Link from "next/link";
import { useState } from "react";
import { TraceFormData } from "../../../edit/components/types";
import { cn } from "@/lib/utils";
import { ScreenComment } from "../shared/screen-comments-panel";
import { ScreenMarkerStrip } from "../shared/screen-marker-strip";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pause, Play } from "lucide-react";

export function ReviewVideoPanelIOS({
  traceData,
  isAdmin,
  videoRef,
  activeScreenId,
  commentsByScreen,
  currentTime,
  videoDuration,
  onScreenSelect,
  onScrubVideo,
  onVideoLoadedMetadata,
  onVideoTimeUpdate,
  onVideoSeeking,
  onVideoPlay,
  onVideoPause,
  isPlaying,
  onTogglePlayback,
  onVideoLayoutOrientationChange,
}: {
  traceData: TraceFormData;
  isAdmin: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  activeScreenId: string | null;
  commentsByScreen: Record<string, ScreenComment[]>;
  currentTime: number;
  videoDuration: number;
  onScreenSelect: (screenId: string, timestamp: number) => void;
  onScrubVideo: (timestamp: number) => void;
  onVideoLoadedMetadata: (video: HTMLVideoElement) => void;
  onVideoTimeUpdate: (video: HTMLVideoElement) => void;
  onVideoSeeking: (video: HTMLVideoElement) => void;
  onVideoPlay: () => void;
  onVideoPause: () => void;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onVideoLayoutOrientationChange?: (
    orientation: "portrait" | "landscape",
  ) => void;
}) {
  const [videoOrientation, setVideoOrientation] = useState<
    "portrait" | "landscape" | null
  >(null);
  const videoLayoutClass =
    videoOrientation === "landscape"
      ? "w-full max-w-full h-auto"
      : "w-[75%] max-w-[60%] h-auto";

  return (
    <aside className="flex h-full min-h-0 w-full flex-col">
      {/* Header strip */}
      <div className="flex h-9 flex-shrink-0 items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 dark:border-neutral-800 dark:bg-neutral-950">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            isAdmin ? "bg-amber-500" : "bg-neutral-400",
          )}
        />
        <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
          {isAdmin ? "Admin Review" : "Owner Review"}
        </span>
        {isAdmin && (
          <Button
            size="sm"
            className="ml-auto text-[10px] font-semibold tracking-widest text-neutral-300 uppercase transition-colors hover:text-neutral-100 dark:text-neutral-700 dark:hover:text-neutral-800"
          >
            <ArrowLeft className="h-2 w-2" />
            <Link href="/admin/tasks">Back to list</Link>
          </Button>
        )}
      </div>

      {/* Scrollable content: reference only */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-3">
          {traceData.description && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold tracking-widest text-neutral-400 uppercase dark:text-neutral-500">
                Task
              </span>
              <p className="text-[13px] leading-6 font-medium text-neutral-800 dark:text-neutral-100">
                {traceData.description}
              </p>
            </div>
          )}
          <div className="flex w-full justify-center overflow-x-auto pb-1">
            <video
              ref={videoRef}
              crossOrigin="anonymous"
              preload="auto"
              className={cn(
                videoLayoutClass,
                "min-w-0 rounded-lg border border-neutral-300 object-contain dark:border-neutral-600",
              )}
              controls={false}
              playsInline
              onLoadedMetadata={(event) => {
                const videoElement = event.currentTarget;
                onVideoLoadedMetadata(videoElement);
                if (!videoElement.videoWidth || !videoElement.videoHeight) {
                  return;
                }
                const nextOrientation =
                  videoElement.videoWidth > videoElement.videoHeight
                    ? "landscape"
                    : "portrait";
                setVideoOrientation(nextOrientation);
                onVideoLayoutOrientationChange?.(nextOrientation);
              }}
              onTimeUpdate={(event) => onVideoTimeUpdate(event.currentTarget)}
              onSeeking={(event) => onVideoSeeking(event.currentTarget)}
              onPlay={onVideoPlay}
              onPause={onVideoPause}
            />
          </div>
          <ScreenMarkerStrip
            screens={traceData.screens}
            activeScreenId={activeScreenId}
            commentsByScreen={commentsByScreen}
            currentTime={currentTime}
            duration={videoDuration}
            onSelectScreen={onScreenSelect}
            onScrub={onScrubVideo}
            headerAccessory={
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                className="size-6 shrink-0 rounded-md"
                disabled={videoDuration <= 0}
                onClick={() => onTogglePlayback()}
                aria-label={isPlaying ? "Pause video" : "Play video"}
                title={isPlaying ? "Pause video (Space)" : "Play video (Space)"}
              >
                {isPlaying ? (
                  <Pause className="size-3 shrink-0" />
                ) : (
                  <Play className="size-3 shrink-0" />
                )}
              </Button>
            }
          />
        </div>
      </div>
    </aside>
  );
}
