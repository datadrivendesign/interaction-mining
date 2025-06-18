"use client";

import { useEffect, useReducer } from "react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, CircleCheck, FileVideo, Loader2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useCapture } from "@/lib/hooks";
import { CaptureSWROperations, fileFetcher, handleDeleteFile } from "./util";
import DeleteUploadDialog from "./components/delete-upload-dialog";
import { processCaptureFiles } from "@/lib/actions";
import { cn, Platform } from "@/lib/utils";
interface CaptureState {
  hasUploads: boolean;
  processingState: "idle" | "pending" | "finished" | "error";
  hasCopied: boolean;
  hasTranscoded: boolean;
  nonVideoUploads?: any[];
}

function captureStateReducer(
  state: CaptureState,
  action:
    | {
      type: "UPDATE_PROCESS";
      nextProcessingState: "idle" | "pending" | "finished" | "error";
    }
    | { type: "UPDATE"; uploadList: any[]; processList: any[] }
): CaptureState {
  switch (action.type) {
    case "UPDATE_PROCESS":
      const { nextProcessingState } = action;
      let nextState = {
        ...state,
        processingState: nextProcessingState,
      };

      // if we're running the ingestion pipeline again, reset the copied and transcoded states
      if (nextProcessingState === "pending") {
        nextState.hasCopied = false;
        nextState.hasTranscoded = false;
      }

      return nextState;
    case "UPDATE":
      const { uploadList, processList } = action;
      // track if uploads exist
      const hasUploads = uploadList.length > 0;

      let hasCopied = false;
      let hasTranscoded = false;

      if (hasUploads) {
        if (state.processingState !== "pending") {
          // determine if all video files have been transcoded
          const isTranscodeDisabled = (
            !process.env.NEXT_PUBLIC_TRANSCODE_LAMBDA || 
            process.env.NEXT_PUBLIC_TRANSCODE_LAMBDA === ""
          );
          hasTranscoded = isTranscodeDisabled || (
            hasUploads &&
            uploadList.every((upload) => {
              const segments = upload.fileKey.split("/");
              const fileName = segments.pop() || "";
              const baseName = fileName.replace(/\.(mp4|mov)$/, "");
              return processList.some((t) =>
                t.fileKey.includes(`${baseName}.webm`)
              );
            })
          );
          
          // determine if all non-video files or thumbnails have been copied
          const nonVideoUploads = uploadList.filter(
            (upload) =>
              !/\.(mp4|mov)$/.test(upload.fileKey) &&
              !upload.fileKey.includes("thumbnails")
          );
          // determine if file copying is needed, if not just display transcoding status
          hasCopied = false;
          if (nonVideoUploads.length === 0 && !isTranscodeDisabled) {
            hasCopied = hasTranscoded;
          } else {
            hasCopied = nonVideoUploads.every((upload) => {
              const segments = upload.fileKey.split("/");
              const fileName = segments.pop() || "";
              return processList.some((t) => t.fileKey.includes(fileName));
            });
            if (processList.length === 0) {
              hasCopied = false;
            }
          }
        }
      }

      return {
        hasUploads: hasUploads,
        processingState: state.processingState,
        hasCopied: hasCopied,
        hasTranscoded: hasTranscoded,
      };
    default:
      return state;
  }
}

export default function Page() {
  const { captureId } = useParams() as { captureId: string };
  const { capture, isLoading: isCaptureLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });
  const [captureState, dispatch] = useReducer(captureStateReducer, {
    hasUploads: false,
    processingState: "idle",
    hasCopied: false,
    hasTranscoded: false,
  });
  const os: Platform | undefined = capture?.task?.os as Platform | undefined;
  const { data: uploadList = [], isLoading: isUploadListLoading } = useSWR(
    [CaptureSWROperations.UPLOAD_LIST, `uploads/${captureId}`],
    fileFetcher,
    { refreshInterval: 5000 }
  );

  const { data: processList = [] } = useSWR(
    [CaptureSWROperations.TRANSCODE_LIST, `processed/${captureId}`],
    fileFetcher,
    { refreshInterval: 5000 }
  );

  const handleProcessFiles = async () => {
    if (uploadList.length === 0) { return; }
    dispatch({ type: "UPDATE_PROCESS", nextProcessingState: "pending" });
    const res = await processCaptureFiles(uploadList[0].fileKey);
    if (!res.ok) {
      console.error("Failed to process files:", res.message);
      dispatch({ type: "UPDATE_PROCESS", nextProcessingState: "error" });
      return;
    }
    dispatch({ type: "UPDATE_PROCESS", nextProcessingState: "finished" });
  };

  const isReadyToRedirect =
    (os === Platform.IOS &&
      captureState.hasTranscoded &&
      captureState.hasCopied &&
      ["idle", "finished"].includes(captureState.processingState)) ||
    (os === Platform.ANDROID && captureState.hasUploads);

  const redirectToFrameExtract = () => {
    capture?.id ? redirect(`/capture/${capture.id}/edit`) : null;
  };

  useEffect(() => {
    dispatch({ type: "UPDATE", uploadList, processList });
  }, [uploadList, processList]);

  return (
    <main className="relative z-0 flex flex-col w-dvw min-h-dvh items-center justify-start">
      <div className="relative z-0 flex flex-col w-full h-full items-center justify-start p-4 md:p-16 gap-4">
        <Card className="w-full max-w-screen-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Start capture session</CardTitle>
            <CardDescription>
              {os == 'android' ? 
                "Open the ODIM app on your device and scan the QR code below to start the capture session." : 
                "Open your Camera app and scan the QR code to navigate to the capture session page."
              }

            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col md:flex-row w-full gap-x-6">
              <div className="flex flex-col md:w-1/2">
                {!isCaptureLoading && capture ? (
                  <QRCodeSVG
                    className="w-full max-w-3xs h-auto rounded-xl object-contain aspect-square p-4 bg-white"
                    value={
                      os === Platform.ANDROID
                        ? `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/api/capture/${captureId}`
                        : `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/capture/${captureId}/upload`
                    }
                  />
                ) : (
                  <div className="w-full max-w-3xs h-auto rounded-xl object-contain aspect-square p-4 bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full max-w-screen-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Task recording</CardTitle>
            <CardDescription>
              Your recorded task video will appear here once you start uploading
              them from your device. <strong>Remember to turn on "Do not disturb" mode before you start recording.</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Uploaded files</h2>
                <span className="inline-flex items-center text-sm text-muted-foreground">
                  {isUploadListLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1.5" />
                      Loading...
                    </>
                  ) : (
                    `${uploadList.length} file${uploadList.length !== 1 ? "s" : ""
                    } uploaded`
                  )}
                </span>
              </div>
              {!isUploadListLoading && uploadList.length > 0 ? (
                <ul className="flex flex-col w-full rounded-xl border border-neutral-200 dark:border-neutral-800">
                  {uploadList.map((file: any, index: number) => (
                    <li
                      key={index}
                      className="flex justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 last:border-none"
                    >
                      <div className="flex items-center gap-2">
                        <FileVideo className="size-4" />
                        <Link
                          href={file.fileUrl}
                          target="_blank"
                          className="hover:underline"
                        >
                          {file.fileName}
                        </Link>
                      </div>
                      <DeleteUploadDialog
                        onContinue={() =>
                          handleDeleteFile(captureId, file.fileKey)
                        }
                      >
                        <button className="inline-flex items-center cursor-pointer">
                          <X className="size-4 text-neutral-500 hover:opacity-75" />
                        </button>
                      </DeleteUploadDialog>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col justify-center items-center w-full p-4 md:p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-muted-foreground transition-colors duration-150 ease-in-out cursor-pointer">
                  <span className="inline-flex flex-col items-center text-center text-sm">
                    Once you&rsquo;re ready, start uploading your capture
                    recordings.
                  </span>
                </div>
              )}
            </div>
            {os === Platform.IOS && (
              <div className="flex justify-end mt-4">
                <Button
                  disabled={uploadList.length === 0}
                  onClick={handleProcessFiles}
                >
                  Submit files
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        {os === Platform.IOS && (
          <Card
            className={cn(
              "w-full max-w-screen-sm transition-opacity duration-300 ease-in-out",
              captureState.processingState !== "idle" ||
                (captureState.hasTranscoded && captureState.hasTranscoded)
                ? "opacity-100 pointer-events-auto"
                : "opacity-50 pointer-events-none"
            )}
          >
            <CardHeader>
              <CardTitle className="text-2xl">Capture processing</CardTitle>
              <CardDescription>
                {captureState.hasTranscoded && captureState.hasCopied
                  ? "Your uploads have been processed and transcoded. You can now proceed to the trace creation editor."
                  : "We’re processing your capture recordings and setting up the editor. Sit tight, this may take a few minutes."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col w-full rounded-xl border border-muted-background mb-4">
                <li className="flex justify-between items-center px-4 py-2 border-b border-muted-background last:border-none">
                  <span className="text-sm font-medium">
                    {captureState.processingState === "idle" &&
                      (captureState.hasCopied
                        ? "File processing complete"
                        : "Process capture files")}

                    {captureState.processingState === "pending" &&
                      (captureState.hasCopied
                        ? "File processing complete"
                        : "Processing capture files...")}

                    {captureState.processingState === "finished" &&
                      (captureState.hasCopied
                        ? "File processing complete"
                        : "Processing capture files...")}
                  </span>

                  {captureState.processingState === "idle" &&
                    captureState.hasCopied && (
                      <CircleCheck className="size-5 text-blue-500" />
                    )}

                  {captureState.processingState === "pending" &&
                    (captureState.hasCopied ? (
                      <CircleCheck className="size-5 text-blue-500" />
                    ) : (
                      <Loader2 className="size-5 text-blue-500 animate-spin" />
                    ))}

                  {captureState.processingState === "finished" &&
                    (captureState.hasCopied ? (
                      <CircleCheck className="size-5 text-blue-500" />
                    ) : (
                      <Loader2 className="size-5 text-blue-500 animate-spin" />
                    ))}
                </li>
                {(process.env.NEXT_PUBLIC_TRANSCODE_LAMBDA && 
                  process.env.NEXT_PUBLIC_TRANSCODE_LAMBDA !== "") &&
                 <li className="flex justify-between items-center px-4 py-2 border-b border-muted-background last:border-none">
                  <span className="text-sm font-medium">
                    {captureState.processingState === "idle" &&
                      (captureState.hasTranscoded
                        ? "Transcoding complete"
                        : "Transcode video files")}

                    {captureState.processingState === "pending" &&
                      (captureState.hasTranscoded
                        ? "Video transcoding complete"
                        : "Transcoding video files...")}

                    {captureState.processingState === "finished" &&
                      (captureState.hasTranscoded
                        ? "Video transcoding complete"
                        : "Transcoding video files...")}
                  </span>
                  {captureState.processingState === "idle" &&
                    captureState.hasTranscoded && (
                      <CircleCheck className="size-5 text-blue-500" />
                    )}

                  {captureState.processingState === "pending" &&
                    (captureState.hasTranscoded ? (
                      <CircleCheck className="size-5 text-blue-500" />
                    ) : (
                      <Loader2 className="size-5 text-blue-500 animate-spin" />
                    ))}

                  {captureState.processingState === "finished" &&
                    (captureState.hasTranscoded ? (
                      <CircleCheck className="size-5 text-blue-500" />
                    ) : (
                      <Loader2 className="size-5 text-blue-500 animate-spin" />
                    ))}
                </li>}
              </ul>
            </CardContent>
          </Card>
        )}
        <div className="flex w-full max-w-screen-sm justify-end">
          <Button
            onClick={redirectToFrameExtract}
            disabled={!isReadyToRedirect}
            tooltip={"Navigate to trace creation editor"}
          >
            Go to editor <ArrowRight />
          </Button>
        </div>
      </div>
    </main>
  );
}
