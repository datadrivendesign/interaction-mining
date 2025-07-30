import { useFormContext } from "react-hook-form";
import { useState, useEffect } from "react";

import { Platform } from "@/lib/utils";
import RepairScreenCanvas from "./repair-screen-canvas";
import { FrameData, TraceFormData } from "../types";
import { ScreenGesture } from "@prisma/client";
import { gestureOptions } from "@/lib/utils/gesture-options";

export function FocusView({
  screen,
  vh,
  os,
  isLastScreen,
}: {
  screen: FrameData;
  vh: any;
  os: Platform;
  isLastScreen: boolean;
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
    }
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
      <div className="flex justify-center w-full h-full overflow-hidden">
        <RepairScreenCanvas
          key={screen.id}
          screen={screen}
          vh={vh}
          gesture={gesture}
          setGesture={setGesture}
          gestureOptions={gestureOptions}
          os={os}
          isLastScreen={isLastScreen}
        />
      </div>
    </>
  );
}
