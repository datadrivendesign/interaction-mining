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
import { Badge, ListRestart } from "lucide-react";
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

  const populateFrameData = async (
    files: ListedFiles[]
  ): Promise<{
    frames: FrameData[];
    vhs: { [key: string]: any };
    gestures: { [key: string]: ScreenGesture };
  }> => {
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

  useEffect(() => {
    populateFrameData(files).then(({ frames, vhs, gestures }) => {
      originalScreens.current = [...frames];
      originalVHs.current = { ...vhs };
      originalGestures.current = { ...gestures };
      // populate form state if empty
      if (currScreens.length === 0) {
        setValue("screens", frames);
      } else {
        // check if currScreens from draft and populate src field
        currScreens.forEach((screen) => {
          if (!screen.src) {
            const originalScreen = frames.find((s) => s.id === screen.id);
            if (originalScreen) {
              screen.src = originalScreen.src;
            }
          }
        });
        setValue(
          "screens",
          currScreens.sort((a, b) => a.timestamp - b.timestamp)
        );
      }
      if (Object.keys(currVHs).length === 0) {
        setValue("vhs", vhs);
      } else {
        // check if currVHs from draft and populate vhs field
        Object.keys(currVHs).forEach((id) => {
          if (!currVHs[id]) {
            const originalVH = vhs[id];
            if (originalVH) {
              currVHs[id] = originalVH as any;
            }
          }
        });
        setValue("vhs", currVHs);
      }
      if (Object.keys(currGestures).length === 0) {
        setValue("gestures", gestures);
      }
    });
    // adding curr vars to dependency array can cause infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currScreens.length, files, setValue]);

  const resetFormState = () => {
    if (originalScreens.current.length !== currScreens.length) {
      setValue("screens", originalScreens.current);
      setValue("vhs", originalVHs.current);
      setValue("gestures", originalGestures.current);
    }
  };

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
                    <Badge>
                      <article className="prose prose-neutral dark:prose-invert leading-snug text-xs font-semibold text-white dark:text-neutral-900 w-full whitespace-pre-wrap">
                        <p>
                          Task:{" "}
                          {capture?.task?.description ?? "No task provided."}
                        </p>
                      </article>
                    </Badge>
                    {capture?.feedback && capture?.feedback !== "" && (
                      <div className="text-sm mt-3">
                        <strong>Feedback:</strong>
                        <p className="text-xs">
                          {capture?.feedback ?? "No feedback provided."}
                        </p>
                      </div>
                    )}
                  </CardHeader>
                </Card>

                <Button onClick={resetFormState}>
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
function createScreenGesture(gesture: {
  type: string | null;
  scrollDeltaX: number | null;
  scrollDeltaY: number | null;
  x: number | null;
  y: number | null;
  description: string | null;
}): {
  type: string | null;
  scrollDeltaX: number | null;
  scrollDeltaY: number | null;
  x: number | null;
  y: number | null;
  description: string | null;
} {
  throw new Error("Function not implemented.");
}
