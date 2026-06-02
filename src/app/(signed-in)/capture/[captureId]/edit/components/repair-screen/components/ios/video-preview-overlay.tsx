import { Ref } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface VideoPreviewOverlayProps {
  videoRef: Ref<HTMLVideoElement>;
  displayedPreviewFrameSrc: string | null;
  incomingPreviewFrameSrc: string | null;
  isIncomingPreviewVisible: boolean;
  hasPreviewOverlay: boolean;
  onPlay: () => void;
  onPause: () => void;
  onIncomingPreviewLoad: (src: string) => void;
}

export function VideoPreviewOverlay({
  videoRef,
  displayedPreviewFrameSrc,
  incomingPreviewFrameSrc,
  isIncomingPreviewVisible,
  hasPreviewOverlay,
  onPlay,
  onPause,
  onIncomingPreviewLoad,
}: VideoPreviewOverlayProps) {
  return (
    <div className="relative flex justify-center items-center w-full h-full">
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        preload="auto"
        className={cn(
          "relative z-0 max-w-full max-h-full rounded-lg object-contain transition-opacity",
          hasPreviewOverlay ? "opacity-0" : "opacity-100",
        )}
        controls={false}
        onPlay={onPlay}
        onPause={onPause}
      />
      {displayedPreviewFrameSrc ? (
        <Image
          src={displayedPreviewFrameSrc}
          alt="Scrub preview"
          fill
          unoptimized
          sizes="100vw"
          className="pointer-events-none absolute inset-0 z-10 h-full w-full rounded-lg object-contain"
        />
      ) : null}
      {incomingPreviewFrameSrc ? (
        <Image
          key={incomingPreviewFrameSrc}
          src={incomingPreviewFrameSrc}
          alt="Incoming scrub preview"
          fill
          unoptimized
          sizes="100vw"
          onLoad={() => onIncomingPreviewLoad(incomingPreviewFrameSrc)}
          className={cn(
            "pointer-events-none absolute inset-0 z-20 h-full w-full rounded-lg object-contain transition-opacity duration-75",
            isIncomingPreviewVisible ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
    </div>
  );
}
