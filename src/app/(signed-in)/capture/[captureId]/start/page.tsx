"use client";

import { useEffect, useMemo, useState } from "react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, FileVideo, Loader2, X } from "lucide-react";
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
import {
  CaptureSWROperations,
  fileFetcher,
  getSWRConfig,
  handleDeleteFile,
} from "../util";
import DeleteUploadDialog from "./components/delete-upload-dialog";
import { revalidateCaptureCaches, updateCapture } from "@/lib/actions";
import { Platform } from "@/lib/utils";
import { CaptureStatus } from "@prisma/client";

enum CaptureState {
  IDLE = 0,
  UPLOADED = 1,
}

export default function Page() {
  console.log("[START PAGE] Page component rendered");
  const { captureId } = useParams() as { captureId: string };

  const [captureState, setCaptureState] = useState<CaptureState>(
    CaptureState.IDLE
  );
  const [deleteDrafts, setDeleteDrafts] = useState<boolean>(true);
  const { capture, isLoading: isCaptureLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });
  const os: Platform | undefined = capture?.task?.os as Platform | undefined;
  // SWR (polling) to check updates if files been uploaded for this capture
  const { data: uploadList = [], isLoading: isUploadListLoading } = useSWR(
    [CaptureSWROperations.UPLOAD_LIST, captureId],
    fileFetcher,
    getSWRConfig(CaptureSWROperations.UPLOAD_LIST, captureId)
  );
  // filter out draft autosaves and screen images
  const filteredUserUploads = useMemo(
    () =>
      uploadList.filter(
        (file) =>
          !file.fileKey.includes("/drafts") &&
          !file.fileKey.includes("/screens")
      ),
    [uploadList]
  );
  // count number of draft autosaves
  const numFilteredDrafts = useMemo(
    () => uploadList.filter((file) => file.fileKey.includes("/drafts")),
    [uploadList]
  );

  // useEffect to check if capture status should be updated or not
  useEffect(() => {
    console.log("[START PAGE] useEffect triggered", {
      captureState,
      filteredUserUploadsLength: filteredUserUploads.length,
      capture: !!capture,
    });

    if (
      capture &&
      captureState === CaptureState.IDLE &&
      filteredUserUploads.length > 0
    ) {
      console.log("[START PAGE] Setting state to UPLOADED");
      setCaptureState(CaptureState.UPLOADED);
    } else if (
      capture &&
      captureState === CaptureState.UPLOADED &&
      filteredUserUploads.length === 0
    ) {
      console.log("[START PAGE] Setting state to IDLE");
      setCaptureState(CaptureState.IDLE);
    }
  }, [capture, captureState, filteredUserUploads.length]);

  const redirectToTraceProcess = async () => {
    const captureRes = await updateCapture(captureId, {
      status: CaptureStatus.PROCESSING,
    });
    if (!captureRes.ok || !captureRes.data || !captureRes.data.id) {
      console.error(captureRes.message);
      return;
    }
    await revalidateCaptureCaches();
    redirect(`/capture/${captureRes.data.id}/edit`);
  };

  /**
   * Delete the upload and all auto-saves (if user selected) for the file
   * @param captureId - The ID of the capture
   * @param fileKey - The key of the file to delete
   */
  const handleDeleteUpload = (captureId: string, fileKey: string) => {
    handleDeleteFile(captureId, fileKey);
    if (deleteDrafts) {
      // delete all auto-saves for the file
      const draftFiles = numFilteredDrafts.map((draft) => draft.fileKey);
      draftFiles.forEach((draft) => {
        handleDeleteFile(captureId, draft);
      });
    }
    setCaptureState(CaptureState.IDLE);
  };

  return (
    <main className="relative z-0 flex flex-col w-dvw min-h-dvh items-center justify-start">
      <div className="relative z-0 flex flex-col w-full h-full items-center justify-start p-4 md:p-16 gap-4">
        <Card className="w-full max-w-screen-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Start capture session</CardTitle>
            <CardDescription>
              {os == "android"
                ? "Open the ODIM app on your device and scan the QR code below to start the capture session."
                : "Open your Camera app and scan the QR code to navigate to the capture session page."}
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
              them from your device.{" "}
              <strong>
                Remember to turn on &ldquo;Do not Disturb&rdquo; before you
                start recording.
              </strong>
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
                    <>
                      {filteredUserUploads.length} file
                      {filteredUserUploads.length !== 1 ? "s" : ""} uploaded
                      {numFilteredDrafts.length > 0 &&
                        `, ${numFilteredDrafts.length} auto-save${
                          numFilteredDrafts.length !== 1 ? "s" : ""
                        }`}
                    </>
                  )}
                </span>
              </div>
              {!isUploadListLoading && filteredUserUploads.length > 0 ? (
                <ul className="flex flex-col w-full rounded-xl border border-neutral-200 dark:border-neutral-800">
                  {filteredUserUploads.map((file: any, index: number) => (
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
                        deleteDrafts={deleteDrafts}
                        setDeleteDrafts={setDeleteDrafts}
                        onContinue={() => {
                          handleDeleteUpload(captureId, file.fileKey);
                        }}
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
          </CardContent>
        </Card>
        <div className="flex w-full max-w-screen-sm justify-end">
          <Button
            onClick={redirectToTraceProcess}
            disabled={captureState < CaptureState.UPLOADED}
            tooltip={"Navigate to trace creation editor"}
          >
            Go to editor <ArrowRight />
          </Button>
        </div>
      </div>
    </main>
  );
}
