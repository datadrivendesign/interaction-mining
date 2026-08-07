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
              "pointer-events-auto rounded-full border bg-background/80 shadow-sm backdrop-blur-sm",
              isLivePhotoActive && "animate-pulse text-amber-500",
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
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-3xl font-semibold text-muted-foreground lg:text-4xl">
            Select a screen from the capture filmstrip.
          </span>
        </div>
      )}
    </>
  );
}
