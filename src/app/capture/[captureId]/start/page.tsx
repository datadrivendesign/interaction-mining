"use client";

import { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, FileVideo, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { CaptureSWROperations, fileFetcher, handleDeleteFile } from "./util";
import DeleteUploadDialog from "./components/delete-upload-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCapture } from "@/lib/hooks";

enum CaptureState {
  IDLE = 0,
  CONNECTED = 1,
  UPLOADED = 2,
  PROCESSING = 3,
  PROCESSED = 4,
}

export default function Page({}: {}) {
  const { captureId } = useParams() as { captureId: string };

  const [captureState, setCaptureState] = useState<CaptureState>(
    CaptureState.IDLE
  );

  const { capture, isLoading: isCaptureLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });

  const { data: uploadList = [], isLoading: isUploadListLoading } = useSWR(
    [CaptureSWROperations.UPLOAD_LIST, captureId],
    fileFetcher,
    {
      refreshInterval: 10,
    }
  );

  let os = capture?.task?.os;
  useEffect(() => {
    if (capture && captureState <= CaptureState.CONNECTED) {
      if (capture.src && uploadList.length > 0) {
        setCaptureState(CaptureState.UPLOADED);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture, uploadList.length]);

  const redirectToFrameExtract = () => {
    capture?.id ? redirect(`/capture/${capture.id}/edit`) : null;
  };

  return (
    <div className="flex flex-col w-dvw min-h-dvh items-center justify-start p-4 md:p-16 gap-4">
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Start capture session</CardTitle>
          <CardDescription>
            Open the ODIM app on your device and scan the QR code below to start
            the capture session.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex flex-col md:flex-row w-full gap-x-6">
            <div className="flex flex-col md:w-1/2">
              {!isCaptureLoading && capture ? (
                <QRCodeSVG
                  className="w-full max-w-3xs h-auto rounded-xl object-contain aspect-square p-4 bg-white"
                  value={
                    os === "android"
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
      <Card
        className={cn(
          "w-full max-w-screen-sm"
          // uploadList && uploadList.length > 0
          //   ? "opacity-100"
          //   : "opacity-50 pointer-events-none"
        )}
      >
        <CardHeader>
          <CardTitle className="text-2xl">Session recordings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col w-full mb-4">
            <h2 className="font-semibold mb-2">Uploaded files</h2>
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
        </CardContent>
      </Card>
      <div className="flex justify-end w-full max-w-screen-sm">
        <Button
          className="gap-1"
          disabled={uploadList.length === 0}
          onClick={redirectToFrameExtract}
        >
          Next step <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
