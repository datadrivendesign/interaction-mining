"use client";

import { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowRight,
  FileVideo,
  Minus,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  CaptureSWROperations,
  fileFetcher,
  handleDeleteFile,
} from "./util";
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

  const { capture, isLoading: isCaptureLoading } = useCapture(captureId,{
    includes: { app: true, task: true },
  });

  const { data: uploadList = [], isLoading: isUploadListLoading } = useSWR(
    capture?.src ? [CaptureSWROperations.UPLOAD_LIST, captureId] : null,
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
            Choose the method that works best for you to launch ODIM on your
            phone or tablet. This page will have instructions on what to do
            next.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0 pb-0 md:pb-6">
          <div className="hidden md:flex flex-col md:flex-row w-full gap-x-6">
            <div className="flex flex-col md:w-1/2">
              <article className="flex flex-col">
                <h2 className="text-lg font-semibold mb-2">
                  Using the QR code
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                  Point the camera on your phone or tablet at this QR code to
                  launch ODIM.
                </p>
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
              </article>
            </div>
            <div className="flex flex-col md:w-1/2">
              <article className="flex flex-col">
                <h2 className="text-lg font-semibold mb-2">
                  Using the capture session code
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                  Go to{" "}
                  <Link className="underline" href="/capture/upload">
                    {`https://overhaul-backend.d1z04mdf4ss7va.amplifyapp.com/capture/upload`}
                  </Link>{" "}
                  and enter the following capture session code:
                </p>
                {!isCaptureLoading && capture ? (
                  <div className="flex items-center gap-2 has-[:disabled]:opacity-50">
                    <div className="flex items-center">
                      {capture.otp
                        .substring(0, 3)
                        .split("")
                        .map((digit, index) => (
                          <div
                            key={index}
                            className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800"
                          >
                            {digit}
                          </div>
                        ))}
                    </div>
                    <div role="separator">
                      <Minus />
                    </div>
                    <div className="flex items-center">
                      {capture.otp
                        .substring(3, 6)
                        .split("")
                        .map((digit, index) => (
                          <div
                            key={index}
                            className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800"
                          >
                            {digit}
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 has-[:disabled]:opacity-50">
                    <div className="flex items-center">
                      <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                      <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                      <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                    </div>
                    <div role="separator">
                      <Minus />
                    </div>
                    <div className="flex items-center">
                      <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                      <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                      <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                    </div>
                  </div>
                )}
              </article>
            </div>
          </div>
          <Accordion type="single" collapsible className="inherit md:hidden">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                <h2 className="text-lg font-semibold">Using the QR code</h2>
              </AccordionTrigger>
              <AccordionContent>
                <article className="flex flex-col">
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    Point the camera on your phone or tablet at this QR code to
                    launch ODIM.
                  </p>
                  {!isCaptureLoading && capture ? (
                    <QRCodeSVG
                    className="w-full max-w-3xs h-auto rounded-xl object-contain aspect-square p-4 bg-white"
                    value={
                      os === "android"
                        ? `https:///api/capture/${captureId}`
                        : `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/capture/${captureId}/upload`
                    }
                  />
                  ) : (
                    <div className="w-full max-w-3xs h-auto rounded-xl object-contain aspect-square p-4 bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                  )}
                </article>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>
                <h2 className="text-lg font-semibold">
                  Using the capture session code
                </h2>
              </AccordionTrigger>
              <AccordionContent>
                <article className="flex flex-col">
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    Go to{" "}
                    <Link className="underline" href="/capture/upload">
                      {`${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/capture/upload`}
                    </Link>{" "}
                    and enter the following capture session code:
                  </p>
                  {!isCaptureLoading && capture ? (
                    <div className="flex items-center gap-2 has-[:disabled]:opacity-50">
                      <div className="flex items-center">
                        {capture.otp
                          .substring(0, 3)
                          .split("")
                          .map((digit, index) => (
                            <div
                              key={index}
                              className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800"
                            >
                              {digit}
                            </div>
                          ))}
                      </div>
                      <div role="separator">
                        <Minus />
                      </div>
                      <div className="flex items-center">
                        {capture.otp
                          .substring(3, 6)
                          .split("")
                          .map((digit, index) => (
                            <div
                              key={index}
                              className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800"
                            >
                              {digit}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 has-[:disabled]:opacity-50">
                      <div className="flex items-center">
                        <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                        <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                        <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                      </div>
                      <div role="separator">
                        <Minus />
                      </div>
                      <div className="flex items-center">
                        <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                        <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                        <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"></div>
                      </div>
                    </div>
                  )}
                </article>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
              <div className="flex flex-col justify-center items-center w-full p-4 md:p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-500 dark:text-neutral-400 transition-colors duration-150 ease-in-out cursor-pointer">
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
