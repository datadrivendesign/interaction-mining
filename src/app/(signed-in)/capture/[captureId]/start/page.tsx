"use client";

import { useEffect, useMemo, useState } from "react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { Badge } from "@/components/ui/badge";

import { useCapture } from "@/lib/hooks";
import {
  CaptureSWROperations,
  fileFetcher,
  getSWRConfig,
  handleDeleteFile,
} from "../util";
import DeleteUploadDialog from "./components/delete-upload-dialog";
import { revalidateCaptureCaches, updateCapture } from "@/lib/actions";
import { Platform, prettyOS } from "@/lib/utils";
import { CaptureStatus } from "@prisma/client";

enum CaptureState {
  IDLE = 0,
  UPLOADED = 1,
}

export default function Page() {
  const { captureId } = useParams() as { captureId: string };

  const [captureState, setCaptureState] = useState<CaptureState>(
    CaptureState.IDLE,
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
    getSWRConfig(CaptureSWROperations.UPLOAD_LIST, captureId),
  );
  // filter out draft autosaves and screen images
  const filteredUserUploads = useMemo(
    () =>
      uploadList.filter(
        (file) =>
          !file.fileKey.includes("/drafts") &&
          !file.fileKey.includes("/screens"),
      ),
    [uploadList],
  );
  // count number of draft autosaves
  const numFilteredDrafts = useMemo(
    () => uploadList.filter((file) => file.fileKey.includes("/drafts")),
    [uploadList],
  );

  // useEffect to check if capture status should be updated or not
  useEffect(() => {
    if (
      capture &&
      captureState === CaptureState.IDLE &&
      filteredUserUploads.length > 0
    ) {
      setCaptureState(CaptureState.UPLOADED);
    } else if (
      capture &&
      captureState === CaptureState.UPLOADED &&
      filteredUserUploads.length === 0
    ) {
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
    <main className="relative z-0 flex min-h-dvh w-full flex-col items-center justify-start">
      <div className="relative z-0 flex h-full w-full flex-col items-center justify-start gap-4 p-3 sm:p-4 md:px-16 md:py-8">
        <Card className="w-full max-w-screen-sm">
          <CardHeader className="px-5 pb-3 pt-4 sm:px-6 sm:pt-6">
            <CardTitle className="text-2xl">Start capture session</CardTitle>
            <CardDescription>
              {os == "android"
                ? "Open the ODIM app on your device and scan the QR code below to start the capture session."
                : "Open your Camera app and scan the QR code to navigate to the capture session page."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
            <div className="grid w-full gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-start">
              <div className="flex justify-center md:justify-start">
                {!isCaptureLoading && capture ? (
                  <QRCodeSVG
                    className="aspect-square h-auto w-full max-w-52 rounded-xl bg-white p-4 object-contain sm:max-w-60 md:max-w-full"
                    value={
                      os === Platform.ANDROID
                        ? `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/api/capture/${captureId}`
                        : `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/capture/${captureId}/qr-upload`
                    }
                  />
                ) : (
                  <div className="aspect-square h-auto w-full max-w-52 animate-pulse rounded-xl bg-neutral-200 p-4 object-contain dark:bg-neutral-800 sm:max-w-60 md:max-w-full"></div>
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
                    {!isCaptureLoading && capture?.app?.metadata.icon ? (
                      <Image
                        src={capture.app.metadata.icon}
                        alt={`${capture.app.metadata.name} icon`}
                        width={48}
                        height={48}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full animate-pulse bg-neutral-200 dark:bg-neutral-800" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {!isCaptureLoading && capture?.app ? (
                      <>
                        <h2 className="line-clamp-2 break-words text-base font-semibold leading-snug">
                          {capture.app.metadata.name}
                        </h2>
                        <p className="line-clamp-1 break-words text-sm text-muted-foreground">
                          {capture.app.metadata.company}
                        </p>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                        <div className="h-3 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                    )}
                  </div>
                  {os ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      {prettyOS(os)}
                    </Badge>
                  ) : null}
                </div>
                <div className="border-l-4 border-neutral-400 bg-neutral-50 py-1 pl-3 pr-2 dark:bg-neutral-900">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Task to record
                  </span>
                  <p className="break-words text-sm font-medium leading-snug">
                    {!isCaptureLoading && capture?.task?.description
                      ? capture.task.description
                      : "Loading task..."}
                  </p>
                </div>
                <div className="rounded-lg bg-muted-background p-3 text-sm text-muted-foreground">
                  Scan the QR code, record the task on your phone, then upload
                  the recording from your phone.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {filteredUserUploads.length > 0 ? (
          <>
            <Card className="w-full max-w-screen-sm">
              <CardHeader className="px-5 pb-3 pt-4 sm:px-6 sm:pt-6">
                <CardTitle className="text-2xl">Task recording</CardTitle>
                <CardDescription>
                  Your uploaded recording appears here. Remember to turn on
                  &ldquo;Do Not Disturb&rdquo; before recording.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                <div className="flex w-full flex-col">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 className="font-semibold">Uploaded files</h2>
                    <span className="inline-flex shrink-0 items-center text-sm text-muted-foreground">
                      {isUploadListLoading ? (
                        <>
                          <Loader2 className="mr-1.5 size-4 animate-spin" />
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
                  <ul className="flex w-full flex-col rounded-xl border border-neutral-200 dark:border-neutral-800">
                    {filteredUserUploads.map((file: any, index: number) => (
                      <li
                        key={index}
                        className="flex min-w-0 justify-between gap-3 border-b border-neutral-200 px-4 py-2 last:border-none dark:border-neutral-800"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <FileVideo className="size-4 shrink-0" />
                          <Link
                            href={file.fileUrl}
                            target="_blank"
                            className="min-w-0 break-all hover:underline"
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
                          <button className="inline-flex shrink-0 cursor-pointer items-center">
                            <X className="size-4 text-neutral-500 hover:opacity-75" />
                          </button>
                        </DeleteUploadDialog>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
            <div className="flex w-full max-w-screen-sm flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Recording uploaded. Continue to the editor when ready.
              </p>
              <Button
                onClick={redirectToTraceProcess}
                disabled={captureState < CaptureState.UPLOADED}
                tooltip={"Navigate to trace creation editor"}
                className="w-full sm:w-auto cursor-pointer"
              >
                Go to editor <ArrowRight />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex w-full max-w-screen-sm flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Upload a recording from your phone to continue.
            </p>
            <Button
              onClick={redirectToTraceProcess}
              disabled
              tooltip={"Navigate to trace creation editor"}
              className="w-full sm:w-auto cursor-pointer"
            >
              Go to editor <ArrowRight />
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
