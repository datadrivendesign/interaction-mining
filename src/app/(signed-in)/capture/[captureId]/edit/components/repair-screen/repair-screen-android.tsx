import { CaptureScreenFile, ListedFiles } from "@/lib/actions";
import { Platform } from "@/lib/utils";
import { useFormContext, useWatch } from "react-hook-form";
import { useNavigation } from "./repair-screen";
import { FrameData, Redaction, TraceFormData } from "../types";
import { useEffect, useRef } from "react";
import { ScreenGesture } from "@prisma/client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListRestart } from "lucide-react";
import { FocusView } from "./focus-view";
import { Filmstrip } from "./filmstrip";
import { toast } from "sonner";

export function RepairScreenAndroid({
  capture,
  files,
  os,
}: {
  capture: any;
  files: ListedFiles[];
  os: Platform;
}) {
  const { setValue } = useFormContext<TraceFormData>();
  const { focusViewIndex } = useNavigation();
  const [watchScreens, watchVHs, watchGestures, watchRedactions] = useWatch({
    name: ["screens", "vhs", "gestures", "redactions"],
  });

  const originalScreens = useRef<FrameData[]>([]);
  const originalVHs = useRef<{ [key: string]: any }>({});
  const originalGestures = useRef<{ [key: string]: ScreenGesture }>({});
  const currScreens = watchScreens as FrameData[];
  const currVHs = watchVHs as { [key: string]: any };
  const currGestures = watchGestures as { [key: string]: ScreenGesture };
  const redactions = watchRedactions as { [key: string]: Redaction[] };

  useEffect(() => {
    const populateFrameData = async (
      files: ListedFiles[]
    ): Promise<{
      frames: FrameData[];
      vhs: { [key: string]: any };
      gestures: { [key: string]: ScreenGesture };
    }> => {
      function createScreenGesture(gesture: ScreenGesture): ScreenGesture {
        const { x, y, scrollDeltaX, scrollDeltaY, type } = gesture;
        const screenGesture: ScreenGesture = {
          type: type,
          x,
          y,
          scrollDeltaX,
          scrollDeltaY,
          description: "",
        };

        function translateTypeAndroidToODIM(
          androidType: string,
          scrollDeltaX: number | null,
          scrollDeltaY: number | null
        ): string {
          if (
            androidType === "TYPE_VIEW_CLICKED" ||
            androidType == "TYPE_VIEW_SELECTED"
          ) {
            return "tap";
          } else if (androidType === "TYPE_VIEW_LONG_CLICKED") {
            return "touch and hold";
          } else if (androidType === "TYPE_VIEW_SCROLLED") {
            if (scrollDeltaX !== null && scrollDeltaY !== null) {
              // get direction of scroll/swipe w. dominant delta direction
              if (scrollDeltaX > 0 && scrollDeltaX > scrollDeltaY) {
                return "swipe right";
              } else if (scrollDeltaX < 0 && scrollDeltaX < scrollDeltaY) {
                return "swipe left";
              } else if (scrollDeltaY > 0 && scrollDeltaY > scrollDeltaX) {
                return "swipe up";
              } else if (scrollDeltaY < 0 && scrollDeltaY < scrollDeltaX) {
                return "swipe down";
              } else {
                return "other";
              }
            }
          }
          // fall through case, don't know what will reach
          return "";
        }

        if (!type || type === "") {
          screenGesture.type = null;
        } else {
          screenGesture.type = translateTypeAndroidToODIM(
            type,
            scrollDeltaX,
            scrollDeltaY
          );
        }
        return screenGesture;
      }

      const frameData: FrameData[] = [];
      const frameVHs: { [key: string]: any } = {};
      const frameGestures: { [key: string]: ScreenGesture } = {};
      for (const [i, c] of files.entries()) {
        try {
          const frameResponse = await fetch(c.fileUrl);
          const frameJson: CaptureScreenFile = await frameResponse.json();
          const b64img = `data:image/png;base64,${frameJson.img}`.trim();
          const frame: FrameData = {
            id: frameJson.created + i.toString(),
            src: b64img,
            timestamp: Date.parse(frameJson.created),
          };
          frameData.push(frame);
          if (frameJson.vh) {
            frameVHs[frame.id] = JSON.parse(frameJson.vh);
          }
          if (frameJson.gesture) {
            frameGestures[frame.id] = createScreenGesture(frameJson.gesture);
          }
        } catch (e) {
          console.error("Error fetching frame data:", e);
          toast.error("Error fetching frame data");
        }
      }
      return {
        frames: frameData.sort((a, b) => a.timestamp - b.timestamp),
        vhs: frameVHs,
        gestures: frameGestures,
      };
    };

    populateFrameData(files).then(({ frames, vhs, gestures }) => {
      originalScreens.current = [...frames];
      originalVHs.current = { ...vhs };
      originalGestures.current = { ...gestures };

      // Only populate data if the form state is empty
      if (
        currScreens.length === 0 &&
        Object.keys(currVHs).length === 0 &&
        Object.keys(currGestures).length === 0
      ) {
        setValue("screens", frames);
        setValue("vhs", vhs);
        setValue("gestures", gestures);
      }
    });
  }, [currScreens.length, files, setValue]);

  return (
    <div className="w-full h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={75} minSize={50} maxSize={75}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel
              defaultSize={33}
              minSize={25}
              maxSize={50}
              className="flex flex-col justify-center items-center h-full min-h-0 p-4 md:p-6 bg-neutral-50 dark:bg-neutral-950 box-border"
            >
              <div className="flex flex-col justify-center items-center w-full h-full gap-4">
                <Card
                  key="task"
                  className="absolute top-4 left-4 w-56 h-32 p-3 z-10 shadow-md bg-background border rounded-md"
                >
                  <CardHeader className="flex flex-col items-center p-2">
                    <CardTitle className="font-medium">Task</CardTitle>
                    <CardDescription>
                      {capture.task?.description ?? "No description"}
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Button
                  onClick={() => {
                    if (originalScreens.current.length !== currScreens.length) {
                      setValue("screens", originalScreens.current);
                      setValue("vhs", originalVHs.current);
                      setValue("gestures", originalGestures.current);
                    }
                  }}
                >
                  <ListRestart /> Reset Screens
                </Button>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
              {focusViewIndex > -1 && focusViewIndex < currScreens.length ? (
                <FocusView
                  key={focusViewIndex}
                  vh={currVHs[currScreens[focusViewIndex].id]}
                  screen={currScreens[focusViewIndex]}
                  isLastScreen={focusViewIndex === currScreens.length - 1}
                  os={os}
                />
              ) : (
                <div className="flex justify-center items-center w-full h-full">
                  <span className="text-3xl lg:text-4xl text-muted-foreground font-semibold">
                    Select a screen from the filmstrip.
                  </span>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={25} maxSize={50}>
          <Filmstrip
            screens={currScreens}
            gestures={currGestures}
            redactions={redactions}
            os={os}
            handleSetTime={(_: number) => {}} // empty function
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
