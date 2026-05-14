import { Aperture } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FrameData } from "../../../types";
import { FocusViewIOS } from "./focus-view-ios";
import { InstructionCardIOS } from "../instruction-card";

interface RepairFocusPanelIOSProps {
  taskDescription: string | undefined;
  focusedScreen: FrameData | null;
  isLastScreen: boolean;
  isLivePhotoActive: boolean;
  onLivePhoto: (timestamp: number) => void;
}

export function RepairFocusPanelIOS({
  taskDescription,
  focusedScreen,
  isLastScreen,
  isLivePhotoActive,
  onLivePhoto,
}: RepairFocusPanelIOSProps) {
  return (
    <>
      <div className="pointer-events-none absolute top-3 left-3 z-40 flex max-w-[11rem] flex-col items-start gap-2 lg:max-w-[11rem]">
        {focusedScreen ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              "pointer-events-auto rounded-full bg-background/80 backdrop-blur-sm shadow-sm border",
              isLivePhotoActive && "text-amber-500 animate-pulse",
            )}
            onClick={() => onLivePhoto(focusedScreen.timestamp)}
            tooltip="Replay ±1s around this frame"
          >
            <Aperture className="size-4" />
          </Button>
        ) : null}
        <InstructionCardIOS taskDescription={taskDescription} />
      </div>
      {focusedScreen ? (
        <FocusViewIOS
          key={focusedScreen.id}
          screen={focusedScreen}
          isLastScreen={isLastScreen}
        />
      ) : (
        <div className="flex justify-center items-center w-full h-full">
          <span className="text-3xl lg:text-4xl text-muted-foreground font-semibold">
            Select a screen from the capture filmstrip.
          </span>
        </div>
      )}
    </>
  );
}
