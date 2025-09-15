import { CaptureScreenFile, ListedFiles } from "@/lib/actions";
import { Platform } from "@/lib/utils";
import { useFormContext, useWatch } from "react-hook-form";
import { useNavigation } from "../../repair-screen";
import { FrameData, Redaction, TraceFormData } from "../../../types";
import { useEffect, useRef, useState } from "react";
import { ScreenGesture } from "@prisma/client";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ListRestart } from "lucide-react";
import { FocusViewAndroid } from "./focus-view-android";
import { Filmstrip } from "../filmstrip";
import { toast } from "sonner";
import { DraftFetchResults } from "../../../../util";

export function RepairScreenAndroid({
  taskDescription,
  files,
  os,
  draftFetchResult,
}: {
  taskDescription: string | undefined;
  files: ListedFiles[];
  os: Platform;
  draftFetchResult: DraftFetchResults;
}) {
  const { setValue } = useFormContext<TraceFormData>();
  const { focusViewIndex } = useNavigation();
  const [watchScreens, watchVHs, watchGestures, watchRedactions] = useWatch({
    name: ["screens", "vhs", "gestures", "redactions"],
  });

  const originalScreens = useRef<FrameData[]>([]);
  const originalVHs = useRef<{ [key: string]: any }>({});
  const originalGestures = useRef<{ [key: string]: ScreenGesture }>({});
  const originalRedactions = useRef<{ [key: string]: Redaction[] }>({});
  const currScreens = watchScreens as FrameData[];
  const currVHs = watchVHs as { [key: string]: any };
  const currGestures = watchGestures as { [key: string]: ScreenGesture };
  const currRedactions = watchRedactions as { [key: string]: Redaction[] };

  const populateFrameData = async (
    files: ListedFiles[]
  ): Promise<{ [key: string]: CaptureScreenFile }> => {
    const regexRule =
      /(\d{4})-(\d{2})-(\d{2}) (\d{2})\:(\d{2})\:(\d{2})\.(\d{3})(.+)\.(json)$/;
    // iOS screen recordings capitalize file extension, so we lowercase here
    const frameFiles = files.filter((f) =>
      regexRule.test(f.fileName.toLowerCase())
    );
    const frames: { [key: string]: CaptureScreenFile } = {};
    for (const [i, c] of frameFiles.entries()) {
      try {
        const frameResponse = await fetch(c.fileUrl);
        const frameJson: CaptureScreenFile = await frameResponse.json();
        const id = frameJson.id;
        frames[id] = frameJson;
      } catch (e) {
        console.error("Error fetching frame data:", e);
        toast.error("Error fetching frame data");
      }
    }
    return frames;
  };

  const populateOriginalData = async (
    files: ListedFiles[]
  ): Promise<{
    screens: FrameData[];
    vhs: { [key: string]: any };
    gestures: { [key: string]: ScreenGesture };
    redactions: { [key: string]: Redaction[] };
  }> => {
    const originalMetadataFile = files.find((f) =>
      f.fileName.toLowerCase().includes("original-metadata.json")
    );
    if (originalMetadataFile) {
      const originalMetadataFileResponse = await fetch(
        originalMetadataFile.fileUrl
      );
      const originalMetadataFileJson =
        await originalMetadataFileResponse.json();
      originalScreens.current = originalMetadataFileJson.screens;
      originalGestures.current = originalMetadataFileJson.gestures;
      originalRedactions.current = originalMetadataFileJson.redactions;
      originalVHs.current = {};
      const frames = await populateFrameData(files);
      originalScreens.current.forEach((screen) => {
        if (!screen.src) {
          const frame = frames[screen.id];
          if (frame.img) {
            screen.src = `data:image/png;base64,${frame.img}`.trim();
          }
          if (frame.vh) {
            originalVHs.current[screen.id] = JSON.parse(frame.vh);
          }
        }
      });
    }
    return {
      screens: originalScreens.current,
      vhs: originalVHs.current,
      gestures: originalGestures.current,
      redactions: originalRedactions.current,
    };
  };

  const resetFormState = () => {
    if (originalScreens.current.length !== currScreens.length) {
      setValue("screens", originalScreens.current);
      setValue("vhs", originalVHs.current);
      setValue("gestures", originalGestures.current);
      setValue("redactions", originalRedactions.current);
    }
  };

  useEffect(() => {
    if (draftFetchResult === DraftFetchResults.LOADING) {
      return;
    } else if (draftFetchResult !== DraftFetchResults.SUCCESS) {
      // if draft fetch result not success, populate from original file
      populateOriginalData(files).then(
        ({ screens, vhs, gestures, redactions }) => {
          setValue(
            "screens",
            screens.sort((a, b) => a.timestamp - b.timestamp)
          );
          setValue("vhs", vhs);
          setValue("gestures", gestures);
          setValue("redactions", redactions);
        }
      );
    } else if (draftFetchResult === DraftFetchResults.SUCCESS) {
      populateOriginalData(files);
      populateFrameData(files).then((frames) => {
        const screensCopy = currScreens.map((screen) => ({ ...screen }));
        const vhCopy = { ...currVHs };
        screensCopy.forEach((screen) => {
          if (!screen.src) {
            const frame = frames[screen.id];
            if (frame) {
              screen.src = `data:image/png;base64,${frame.img}`.trim();
              if (frame.vh) {
                vhCopy[screen.id] = JSON.parse(frame.vh);
              }
            }
          }
        });
        setValue(
          "screens",
          screensCopy.sort((a, b) => a.timestamp - b.timestamp)
        );
        setValue("vhs", vhCopy);
      });
    }
    // adding curr vars to dependency array can cause infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currScreens.length, files, setValue, draftFetchResult]);

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
                <Button onClick={resetFormState}>
                  <ListRestart /> Reset Screens
                </Button>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
              {focusViewIndex > -1 && focusViewIndex < currScreens.length ? (
                <FocusViewAndroid
                  key={focusViewIndex}
                  vh={currVHs[currScreens[focusViewIndex].id]}
                  screen={currScreens[focusViewIndex]}
                  isLastScreen={focusViewIndex === currScreens.length - 1}
                  taskDescription={taskDescription}
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
            key={`filmstrip-${currScreens.length}-${currScreens.filter((s) => s.src && s.src.length > 0).length}`}
            screens={currScreens}
            gestures={currGestures}
            redactions={currRedactions}
            vhs={currVHs}
            os={os}
            handleSetTime={(_: number) => {}} // empty function
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
