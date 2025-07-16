"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getCaptureFiles } from "@/lib/actions";
import { gestureOptions } from "@/lib/utils/gesture-options";
// import TraceData from "@/public/example-trace/inspectData-686c351e1a49688eff88aa70.json"
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScreenReviewData, TraceFormData } from "../edit/components/types";
import { handleTraceSave } from "../edit/util";
import { useCapture } from "@/lib/hooks/capture";
import { Capture } from "@prisma/client";

export default function Page() {
  const params = useParams();
  const captureId = params.captureId as string;
  const [traceData, setTraceData] = useState<TraceFormData>();
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });
  const router = useRouter();

  useEffect(() => {
    const fetchFiles = async () => {
      const files = await getCaptureFiles(captureId);
      if (!files.ok) {
        console.error("Failed to fetch files");
        return;
      }
      const fetchedScreenFiles =  files.data.filter(
        (file) => file.fileKey.includes(`${captureId}/screens`)
      );
      // grab json file from the fileKey
      const screenData: ScreenReviewData[] = await Promise.all(
        fetchedScreenFiles.map(async (file) => {
          const response = await fetch(file.fileUrl);
          const data = await response.json();
          return data;
        })
      )
      const screens = screenData.map((s) => {
        return { id: s.id, src: s.src, timestamp: s.timestamp };
      });
      const vhs = screenData.map((s) => {
        return s.vh ? { [s.id]: s.vh } : {};
      }).reduce((acc, curr) => 
        ({ ...acc, ...curr }), {}
      );
      console.log("vhs:", vhs);
      const gestures = screenData.map((s) => {
        return { [s.id]: s.gesture };
      }).reduce((acc, curr) => 
        ({ ...acc, ...curr }), {}
      );
      const redactions = screenData.map((s) => {
        return { [s.id]: s.redactions };
      }).reduce((acc, curr) => 
        ({ ...acc, ...curr }), {}
      );
      const description = screenData[0].description;
      setTraceData({ screens, vhs, gestures, redactions, description });
    }
    fetchFiles();
  }, [captureId]);

  return(
    <main className="relative w-full h-[calc(100dvh-64px)] flex flex-grow">
      {!isTraceLoading && (
        <ResizablePanelGroup 
          direction="horizontal" 
          className="w-full h-full"
        >
          <ResizablePanel 
            defaultSize={25} minSize={25} maxSize={30}
            className="bg-neutral-50 dark:bg-neutral-950 box-border w-full h-full"
          >
            {traceData && capture && (
              <ReviewPanel 
                traceData={traceData} 
                capture={capture} 
                router={router}
              />
            )}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel 
            defaultSize={75} minSize={70} maxSize={75}
            className="bg-neutral-50 dark:bg-neutral-950 box-border w-full h-full"
          >
            {traceData && <ReviewGallery traceData={traceData} />}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </main>
  )
}

function ReviewPanel({ 
  traceData, 
  capture,
  router,
}: { 
  traceData: TraceFormData, 
  capture: Capture,
  router: ReturnType<typeof useRouter>
}) {
  return(
    <aside className="w-full h-full flex flex-col flex-grow justify-between p-3">
      <Badge variant="default" className="bg-gray-500 mt-5">
        <article className="prose prose-neutral dark:prose-invert leading-snug font-sm font-semibold text-white dark:text-neutral-900 overflow-auto w-full whitespace-pre-wrap">
          <p className="text-center">
            {traceData.description ?? "No description provided."}
          </p>
        </article>
      </Badge>
      <div className="flex flex-row self-align-end justify-center gap-2 mb-5">
        <Button 
          variant="outline" 
          className="bg-green-600 text-white hover:bg-green-700 dark:bg-white dark:text-black"
          onClick={() => {
            handleTraceSave(traceData, capture)
              .then(() => {
                router.push(`/app/${capture.appId}`);
              })
          }}
        >
          Approve
        </Button>
        <Button 
          variant="outline" 
          className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:text-white"
          onClick={() => {
            router.push(`/capture/${capture.id}/edit`);
          }}
        >
          Deny
        </Button>
      </div>
    </aside>
  )
}

function ReviewGallery({ traceData }: { traceData: TraceFormData }) {
  return(
    <section className="block w-full h-full p-5">
      <article className="flex w-full overflow-x-scroll touch-pan-x">
        <div className="flex min-w-full gap-5">              
          {traceData.screens.map((screen) => (
            <figure 
              key={screen.id} 
              className="relative flex flex-col shrink-0 shadow-xs w-1/4">
              {/* Image container */}
              <div className="relative w-full">
                <TooltipProvider delayDuration={100}>
                  <Image 
                    src={screen.src} 
                    alt={screen.id} 
                    width={0} 
                    height={0}
                    sizes="100vw"
                    className="relative z-0 w-full h-full rounded-lg object-contain border-blue-500 border-2"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {traceData.gestures[screen.id].type && <div
                        className="cursor-pointer aspect-square w-[12%] absolute z-10 rounded-full bg-yellow-300 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-85"
                        style={{
                          left: `${(traceData.gestures[screen.id].x ?? 0) * 100}%`,
                          top: `${(traceData.gestures[screen.id].y ?? 0) * 100}%`,
                        }}
                      >
                        {
                          gestureOptions
                            .flatMap((option) => [
                              option,
                              ...(option.subGestures ?? []),
                            ])
                            .find(
                              (option) => option.value === traceData.gestures[screen.id].type
                            )?.icon
                        }
                      </div>}
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={5} className="z-50">
                      <p>{traceData.gestures[screen.id].type}</p>
                    </TooltipContent>
                  </Tooltip>
                  {(traceData.redactions[screen.id] || []).map((redaction, i) => (
                    <Tooltip key={`${redaction.id}`}>
                      <TooltipTrigger asChild>
                        <div className="absolute z-10 bg-black cursor-pointer"
                          style={{
                            left: `${redaction.x * 100}%`,
                            top: `${redaction.y * 100}%`,
                            width: `${redaction.width * 100}%`,
                            height: `${redaction.height * 100}%`,
                          }}>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={10}>
                        <p>{redaction.annotation}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
              
              {/* Gesture caption */}
              <div className="prose prose-neutral dark:prose-invert leading-snug font-sm font-semibold dark:text-neutral-900 overflow-auto h-full w-full whitespace-pre-wrap">
                <p className="text-sm text-center dark:text-neutral-300">
                  {traceData.gestures[screen.id].description ?? "Final task state"}
                </p>
              </div>
            </figure>
          ))}
        </div>
      </article>
    </section>
  )
}