import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";

// import RepairScreenCanvas from "./gesture-menu";
import { FrameData, TraceFormData } from "../../../types";
import { ScreenGesture } from "@prisma/client";
import { gestureOptions } from "@/lib/utils/gesture-options";
import RepairScreenCanvasIOS from "./repair-screen-canvas-ios";

function getInitialGesture(
  screenId: string,
  gestures: { [key: string]: ScreenGesture },
): ScreenGesture {
  return (
    gestures[screenId] ?? {
      type: null,
      x: null,
      y: null,
      scrollDeltaX: 0,
      scrollDeltaY: 0,
    }
  );
}

export function FocusViewIOS({
  screen,
  isLastScreen,
}: {
  screen: FrameData;
  isLastScreen: boolean;
}) {
  const { watch, setValue } = useFormContext<TraceFormData>();

  const gestures = watch("gestures") as { [key: string]: ScreenGesture };

  // Find applicable gesture for screen or set to default template
  const [gesture, setGesture] = useState<ScreenGesture>(
    getInitialGesture(screen.id, gestures),
  );

  useEffect(() => {
    setGesture(getInitialGesture(screen.id, gestures));
  }, [gestures, screen.id]);

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
      <div
        className="relative z-20 flex h-full min-h-0 w-full min-w-0 justify-center overflow-visible"
        data-gesture-safe-area
      >
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
