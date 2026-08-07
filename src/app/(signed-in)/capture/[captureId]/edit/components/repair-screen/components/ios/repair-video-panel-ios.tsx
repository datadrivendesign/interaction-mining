import { Ref } from "react";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { CirclePlay } from "lucide-react";
import { VideoPreviewOverlay } from "./video-preview-overlay";

interface RepairVideoPanelIOSProps {
  videoRef: Ref<HTMLVideoElement>;
  displayedPreviewFrameSrc: string | null;
  incomingPreviewFrameSrc: string | null;
  isIncomingPreviewVisible: boolean;
  hasPreviewOverlay: boolean;
  onPlay: () => void;
  onPause: () => void;
  onIncomingPreviewLoad: (src: string) => void;
}

export function RepairVideoPanelIOS({
  videoRef,
  displayedPreviewFrameSrc,
  incomingPreviewFrameSrc,
  isIncomingPreviewVisible,
  hasPreviewOverlay,
  onPlay,
  onPause,
  onIncomingPreviewLoad,
}: RepairVideoPanelIOSProps) {
  return (
    <>
      <Card
        key="video"
        className="absolute top-0 left-4 z-10 hidden h-20 w-20 rounded-md border bg-background p-0 shadow-md lg:block"
      >
        <CardHeader className="flex flex-col items-center p-2">
          <CardDescription>
            <CirclePlay className="size-10" />
            <p className="text-sm font-semibold">
              <strong>Video</strong>
            </p>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <VideoPreviewOverlay
          videoRef={videoRef}
          displayedPreviewFrameSrc={displayedPreviewFrameSrc}
          incomingPreviewFrameSrc={incomingPreviewFrameSrc}
          isIncomingPreviewVisible={isIncomingPreviewVisible}
          hasPreviewOverlay={hasPreviewOverlay}
          onPlay={onPlay}
          onPause={onPause}
          onIncomingPreviewLoad={onIncomingPreviewLoad}
        />
      </div>
    </>
  );
}
