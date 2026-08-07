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
      {/*
        Always painted, and now the only thing the panel shows once a seek
        settles. A canvas used to sit above this holding a frame read back with
        drawImage, on the theory that Safari would not repaint a paused element
        after a seek. The readback was the stale half: WebKit suspends the video
        pipeline of an idle element, so a seek moves `currentTime` and fires
        `seeked` while drawImage keeps returning the last frame the element
        decoded — measured returning a frame from eleven seconds away. The
        element itself composites; it was being painted over.

        The preview images stack on top and cover it, so hiding it was never
        necessary — and toggling opacity on a video forces a compositor layer
        change, which showed up as a blip each time the overlay came down.
      */}
      <video
        ref={videoRef}
        crossOrigin="anonymous"
        preload="auto"
        className="relative z-0 max-w-full max-h-full rounded-lg object-contain"
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
      {/*
        Preview frames come from a coarse thumbnail grid — roughly a second apart
        on a long recording — so what is showing here can sit up to half a second
        from the playhead. Labelling it means the correction when the real frame
        arrives reads as the picture sharpening rather than the tool changing its
        mind, and it marks the moments when `c` would capture something other
        than what is on screen.
      */}
      {hasPreviewOverlay ? (
        <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2">
          <span className="inline-flex items-center rounded-md border border-black/15 bg-black/55 px-2 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm dark:border-white/25 dark:bg-white/90 dark:text-black">
            Preview
          </span>
        </div>
      ) : null}
    </div>
  );
}
