"use client";

import { useActionState, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import {
  ExternalLink,
  File,
  FileVideo,
  Loader2,
  Upload,
  X,
} from "lucide-react";

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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  captureFetcher,
  fileFetcher,
  handleUploadFile,
  handleDeleteFile,
  CaptureSWROperations,
} from "./util";
import DeleteUploadDialog from "./components/delete-upload-dialog";
import { useCapture } from "@/lib/hooks";

export default function Page() {
  const params = useParams();
  const captureId = params.captureId as string;

  const { capture, isLoading: isDataLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });

  // @ts-ignore app is in there it just doesn't know it :)
  const app = capture?.app;

  const { data: uploadList, isLoading: isUploadListLoading } = useSWR(
    [CaptureSWROperations.UPLOAD_LIST, captureId],
    fileFetcher,
    {
      refreshInterval: 10,
    }
  );

  // File submission logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (_: any, formData: FormData) => {
    return await handleUploadFile(captureId, formData).then((res) => {
      setFile(null);
      return res;
    });
  };

  const [state, formAction, pending] = useActionState(handleSubmit, null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setFile(event.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col w-dvw min-h-dvh items-center justify-start p-4 md:p-16 gap-4">
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex justify-center items-center size-8 mr-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 text-sm tabular-nums">
              1
            </span>{" "}
            Install the target app
          </CardTitle>
          <CardDescription hidden>
            Install the target app to complete the task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row justify-center sm:justify-start items-center w-full gap-4">
              <figure className="w-full max-w-24">
                {!isDataLoading && app ? (
                  <Image
                    className="w-full rounded-3xl object-contain aspect-square"
                    src={app.metadata.icon}
                    alt={`${app.metadata.name} icon`}
                    width={0}
                    height={0}
                    sizes={"100vw"}
                  />
                ) : (
                  <div className="w-full rounded-3xl object-contain aspect-square bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                )}
              </figure>
              <div className="flex flex-col justify-between items-center sm:items-start">
                <div className="flex flex-col items-center sm:items-start mb-4">
                  {!isDataLoading && app ? (
                    <h2 className="font-semibold leading-snug">
                      {app.metadata.name}
                    </h2>
                  ) : (
                    <span className="w-24 h-4.5 md:h-5 bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-3"></span>
                  )}
                  {!isDataLoading && app ? (
                    <p className="text-sm md:text-base font-medium text-neutral-500 dark:text-neutral-400">
                      {app.metadata.developer}
                    </p>
                  ) : (
                    <span className="w-24 h-4 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  )}
                </div>
                {!isDataLoading && app ? (
                  app.metadata.url ? (
                    <Link href={app.metadata.url} target="_blank">
                      <button
                        disabled={!app.metadata.url}
                        className="inline-flex items-center px-3 py-0.5 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-500 text-white text-sm md:text-base font-medium cursor-pointer transition-colors duration-150 ease-in-out"
                      >
                        <ExternalLink className="size-3.5 md:size-4 mr-1" />{" "}
                        Install/Open
                      </button>
                    </Link>
                  ) : (
                    <button
                      disabled={!app.metadata.url}
                      className="inline-flex items-center px-3 py-0.5 rounded-full bg-blue-500 disabled:bg-neutral-500 text-white text-sm md:text-base font-medium"
                    >
                      Not available
                    </button>
                  )
                ) : (
                  <button className="inline-flex items-center px-3 py-0.5 rounded-full bg-neutral-500 text-white text-sm md:text-base font-medium animate-pulse">
                    Loading...
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex justify-center items-center size-8 mr-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 text-sm tabular-nums">
              2
            </span>{" "}
            Record the following task
          </CardTitle>
          <CardDescription hidden>Record the following task</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            {!isDataLoading && capture?.task ? (
              <>
                <article className="prose prose-neutral dark:prose-invert leading-snug">
                  <p>
                    {capture?.task?.description
                      ? capture?.task?.description
                      : "No description provided."}
                  </p>
                </article>
              </>
            ) : (
              <>
                <div className="w-full h-4 bg-neutral-500 dark:bg-neutral-400 animate-pulse rounded"></div>
              </>
            )}
          </div>

          <Accordion
            type="single"
            collapsible
            className="px-4 border border-neutral-200 dark:border-neutral-800 rounded-xl"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I record my screen?</AccordionTrigger>
              <AccordionContent>
                <article className="prose prose-neutral dark:prose-invert leading-snug mb-4">
                  <p>
                    Consult your phone or tablet&rsquo;s documentation to learn
                    how to record your screen.
                  </p>
                </article>
                <Link
                  href="https://support.apple.com/en-us/102653"
                  target="_blank"
                  className="no-underline"
                >
                  <div className="flex flex-col justify-start items-start p-4 md:p-6 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 mb-1 overflow-hidden line-clamp-1">
                      Apple Support
                    </span>
                    <span className="text-base text-blue-500 underline font-medium mb-1 overflow-hidden line-clamp-1">
                      Record the screen on your iPhone, iPad, or iPod touch -
                      Apple Support
                    </span>
                    <p className="text-sm overflow-hidden line-clamp-1">
                      In iOS 11 or later, you can create a screen recording and
                      capture sound.
                    </p>
                  </div>
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex justify-center items-center size-8 mr-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-950 dark:text-neutral-50 text-sm tabular-nums">
              3
            </span>{" "}
            Upload your task recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadList && uploadList.length > 0 && (
            <div className="flex flex-col mb-4">
              <h2 className="font-semibold mb-2">Uploaded files</h2>
              <ul className="flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800">
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
            </div>
          )}
          {state?.error && (
            <div className="border border-red-500 bg-red-500/10 rounded-xl px-4 py-2 mb-4">
              <span className="text-red-500 dark:text-red-400 text-sm">
                {state.error}
              </span>
            </div>
          )}
          <div
            className={cn(
              "flex flex-col justify-center items-center w-full p-4 md:p-6 border-dashed border-neutral-200 hover:border-neutral-500 dark:border-neutral-800 dark:hover:border-neutral-400 rounded-2xl text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 hover:dark:text-neutral-200 transition-colors duration-150 ease-in-out cursor-pointer",
              file ? "border border-solid" : "border-2 border-dashed"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
          >
            <span className="inline-flex flex-col items-center text-center text-sm">
              {file ? (
                <File className="size-6 mb-2" />
              ) : (
                <Upload className="size-6 mb-2" />
              )}
              {file ? (
                `${file.name}`
              ) : (
                <>
                  <p>Tap to select or drop your file here</p>
                  <p>MP4 or MOV</p>
                </>
              )}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <form action={formAction}>
            <input
              hidden
              className="hidden"
              name="file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Upload
            </Button>
          </form>
        </CardFooter>
      </Card>
      <Card className="w-full max-w-screen-sm">
        <CardContent className="p-4 md:p-6">
          If you are done uploading recordings, you may now close this page and
          return to your original device.
        </CardContent>
      </Card>
    </div>
  );
}
