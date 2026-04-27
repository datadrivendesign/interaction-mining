import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";
import { Aperture } from "lucide-react";

// import RepairScreenCanvas from "./gesture-menu";
import { FrameData, TraceFormData } from "../../../types";
import { ScreenGesture } from "@prisma/client";
import { gestureOptions } from "@/lib/utils/gesture-options";
import RepairScreenCanvasIOS from "./repair-screen-canvas-ios";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FocusViewIOS({
  screen,
  isLastScreen,
  onLivePhoto,
  isLivePhotoActive,
}: {
  screen: FrameData;
  isLastScreen: boolean;
  onLivePhoto?: (timestamp: number) => void;
  isLivePhotoActive?: boolean;
}) {
  const { watch, setValue } = useFormContext<TraceFormData>();

  const gestures = watch("gestures") as { [key: string]: ScreenGesture };

  // Find applicable gesture for screen or set to default template
  const [gesture, setGesture] = useState<ScreenGesture>(
    gestures[screen.id] ?? {
      type: null,
      x: null,
      y: null,
      scrollDeltaX: 0,
      scrollDeltaY: 0,
    },
  );

  // Update gesture in form data
  useEffect(() => {
    // only update if gesture has changed
    const currentGesture = gestures[screen.id];
    // dumb way to do object equality but pay the price to fix linter error
    if (JSON.stringify(currentGesture) !== JSON.stringify(gesture)) {
      setValue("gestures", {
        ...gestures,
        [screen.id]: gesture,
      });
    }
  }, [gesture, gestures, screen.id, setValue]);

  return (
    <>
      <div className="relative z-20 flex justify-center w-full h-full overflow-visible">
        {onLivePhoto && (
          <div className="absolute top-2 left-2 z-30">
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "rounded-full bg-background/80 backdrop-blur-sm shadow-sm border",
                isLivePhotoActive && "text-amber-500 animate-pulse",
              )}
              onClick={() => onLivePhoto(screen.timestamp)}
              tooltip="Replay ±1s around this frame"
            >
              <Aperture className="size-4" />
            </Button>
          </div>
        )}
        <RepairScreenCanvasIOS
          key={screen.id}
          screen={screen}
          gesture={gesture}
          setGesture={setGesture}
          gestureOptions={gestureOptions}
          isLastScreen={isLastScreen}
        />
      </div>
    </>
  );
}
