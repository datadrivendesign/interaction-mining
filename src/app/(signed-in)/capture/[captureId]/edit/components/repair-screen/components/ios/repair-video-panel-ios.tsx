import { Ref } from "react";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { CirclePlay } from "lucide-react";
import { VideoPreviewOverlay } from "./video-preview-overlay";

interface RepairVideoPanelIOSProps {
  videoRef: Ref<HTMLVideoElement>;
  settledFrameCanvasRef: Ref<HTMLCanvasElement>;
  isSettledFrameVisible: boolean;
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
  settledFrameCanvasRef,
  isSettledFrameVisible,
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
        className="hidden lg:block left-4 absolute top-0 w-20 h-20 p-0 z-10 shadow-md bg-background border rounded-md"
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

      <div className="flex flex-col justify-center items-center w-full h-full gap-4">
        <VideoPreviewOverlay
          videoRef={videoRef}
          settledFrameCanvasRef={settledFrameCanvasRef}
          isSettledFrameVisible={isSettledFrameVisible}
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
