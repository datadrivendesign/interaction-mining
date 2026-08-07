"use client";

import { useActionState, useCallback, useMemo, useRef, useState } from "react";
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

import { handleUploadFile } from "./util";
import DeleteUploadDialog from "./components/delete-upload-dialog";
import { useCapture } from "@/lib/hooks";
import { Badge } from "@/components/ui/badge";
import {
  CaptureSWROperations,
  fileFetcher,
  getSWRConfig,
  handleDeleteFile,
} from "../util";

export default function Page() {
  const params = useParams();
  const captureId = params.captureId as string;

  const { capture, isLoading: isDataLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });

  const app = capture?.app;

  // SWR (polling) to check updates if files been uploaded for this capture
  const { data: uploadList = [] } = useSWR(
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  // state to track if draft autosaves should be deleted
  const [deleteDrafts, setDeleteDrafts] = useState<boolean>(true);

  /**
   * Handles the submission of a file uploaded to form
   * @param _ - The previous state (not used)
   * @param formData - The form data (containing file to upload)
   * @returns The result of the file upload
   */
  const handleSubmit = useCallback(
    async (_: any, formData: FormData) => {
      return await handleUploadFile(captureId, formData).then((res) => {
        setFile(null);
        return res;
      });
    },
    [captureId],
  );

  const [state, formAction, pending] = useActionState(handleSubmit, null);

  /**
   * Handle the change event for the file input
   * @param event - The change event
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  /**
   * Handle the drop event for the file upload area
   * @param event - The drag event
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setFile(event.dataTransfer.files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.files = event.dataTransfer.files;
      }
    }
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
  };

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-start gap-3 p-3 sm:p-4 md:gap-4 md:p-16">
      <Card className="w-full max-w-screen-sm">
        <CardHeader className="px-5 pt-3 pb-1 sm:px-6 sm:pt-5 sm:pb-2">
          <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm text-neutral-950 tabular-nums dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50">
              1
            </span>
            <span>Install the target app</span>
          </CardTitle>
          <CardDescription hidden>
            Install the target app to complete the task
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pt-0 pb-4 sm:px-6 sm:pb-5">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <figure className="w-12 shrink-0 sm:w-20 md:w-24">
              {!isDataLoading && app ? (
                <Image
                  className="aspect-square w-full rounded-xl object-contain sm:rounded-3xl"
                  src={app.metadata.icon}
                  alt={`${app.metadata.name} icon`}
                  width={0}
                  height={0}
                  sizes={"100vw"}
                />
              ) : (
                <div className="aspect-square w-full animate-pulse rounded-xl bg-neutral-200 object-contain sm:rounded-3xl dark:bg-neutral-800" />
              )}
            </figure>
            <div className="flex min-w-0 flex-1 flex-col items-start justify-between">
              <div className="mb-3 flex min-w-0 flex-col items-start">
                {!isDataLoading && app ? (
                  <h2 className="line-clamp-2 leading-snug font-semibold break-words">
                    {app.metadata.name}
                  </h2>
                ) : (
                  <span className="mb-3 h-4.5 w-24 animate-pulse bg-neutral-200 md:h-5 dark:bg-neutral-800"></span>
                )}
                {!isDataLoading && app ? (
                  <p className="line-clamp-1 text-sm font-medium break-words text-muted-foreground md:text-base">
                    {app.metadata.company}
                  </p>
                ) : (
                  <span className="h-4 w-24 animate-pulse bg-neutral-200 dark:bg-neutral-800" />
                )}
              </div>
              {!isDataLoading && app ? (
                app.metadata.url ? (
                  <Link
                    href={app.metadata.url}
                    target="_blank"
                    className="w-full"
                  >
                    <Button
                      disabled={!app.metadata.url}
                      className="min-h-11 w-full"
                    >
                      <ExternalLink className="mr-2 size-4" />
                      <span className="flex-1 text-left">Open App Store</span>
                    </Button>
                  </Link>
                ) : (
                  <Button
                    disabled={!app.metadata.url}
                    className="min-h-11 w-full"
                  >
                    Not available
                  </Button>
                )
              ) : (
                <Button disabled className="min-h-11 w-full animate-pulse">
                  Loading...
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full max-w-screen-sm">
        <CardHeader className="px-5 pt-3 pb-1 sm:px-6 sm:pt-5 sm:pb-2">
          <CardTitle className="flex items-start gap-3 text-xl leading-tight sm:text-2xl">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm text-neutral-950 tabular-nums dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50">
              2
            </span>
            <span>Make a screen recording of the following task</span>
          </CardTitle>
          <CardDescription hidden>Record the following task</CardDescription>
        </CardHeader>
        <CardContent className="px-5 pt-0 pb-4 sm:px-6 sm:pb-5">
          <div className="mb-4">
            {!isDataLoading && capture?.task ? (
              <div className="w-full border-l-4 border-neutral-400 bg-neutral-50 py-1 pr-2 pl-3 dark:bg-neutral-900">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Task to record
                </span>
                <p className="text-sm leading-snug font-medium break-words">
                  {capture?.task?.description
                    ? capture?.task?.description
                    : "No description provided."}
                </p>
              </div>
            ) : (
              <>
                <div className="h-4 w-full animate-pulse rounded bg-neutral-500 dark:bg-neutral-400"></div>
              </>
            )}
          </div>

          <div className="mb-3 text-sm leading-relaxed text-muted-foreground">
            <article className="space-y-2">
              <p>
                Before recording, briefly explore the app so you know how to
                complete the task.
              </p>
              <p>
                Keep the recording short, about 1-2 minutes, and turn on
                &ldquo;Do Not Disturb&rdquo;.
              </p>
            </article>
          </div>

          <Accordion
            type="single"
            collapsible
            className="rounded-xl border border-neutral-200 px-4 dark:border-neutral-800"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I record my screen?</AccordionTrigger>
              <AccordionContent>
                <article className="prose mb-4 leading-snug prose-neutral dark:prose-invert">
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
                  <div className="flex flex-col items-start justify-start rounded-lg bg-neutral-100 p-4 md:p-6 dark:bg-neutral-900">
                    <span className="mb-1 line-clamp-1 overflow-hidden text-sm text-muted-foreground">
                      Apple Support
                    </span>
                    <span className="mb-1 line-clamp-1 overflow-hidden text-base font-medium text-blue-500 underline">
                      Record the screen on your iPhone, iPad, or iPod touch -
                      Apple Support
                    </span>
                    <p className="line-clamp-1 overflow-hidden text-sm">
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
        <CardHeader className="px-5 pt-3 pb-1 sm:px-6 sm:pt-5 sm:pb-2">
          <CardTitle className="flex items-start gap-3 text-xl leading-tight sm:text-2xl">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm text-neutral-950 tabular-nums dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50">
              3
            </span>
            <span>Upload your screen recording of the task</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pt-0 pb-4 sm:px-6 sm:pb-5">
          {filteredUserUploads && filteredUserUploads.length > 0 && (
            <div className="mb-4 flex flex-col">
              <h2 className="mb-2 font-semibold">Uploaded files</h2>
              <span className="inline-flex items-center text-sm text-muted-foreground">
                {isDataLoading ? (
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
              <ul className="flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800">
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
                      onContinue={() =>
                        handleDeleteUpload(captureId, file.fileKey)
                      }
                    >
                      <button className="inline-flex shrink-0 cursor-pointer items-center">
                        <X className="size-4 text-neutral-500 hover:opacity-75" />
                      </button>
                    </DeleteUploadDialog>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {state?.error && (
            <div className="mb-4 rounded-xl border border-red-500 bg-red-500/10 px-4 py-2">
              <span className="text-sm text-red-500 dark:text-red-400">
                {state.error}
              </span>
            </div>
          )}
          <div
            className={cn(
              "flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-dashed border-neutral-200 p-4 text-neutral-500 transition-colors duration-150 ease-in-out hover:border-neutral-500 hover:text-neutral-700 md:p-6 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-400 hover:dark:text-neutral-200",
              file ? "border border-solid" : "border-2 border-dashed",
            )}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <span className="inline-flex max-w-full min-w-0 flex-col items-center text-center text-sm">
              {file ? (
                <File className="mb-2 size-6 shrink-0" />
              ) : (
                <Upload className="mb-2 size-6 shrink-0" />
              )}
              {file ? (
                <span className="max-w-full break-all">{file.name}</span>
              ) : (
                <>
                  <p>Tap to select or drop your file here</p>
                  <p>MP4 or MOV</p>
                </>
              )}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-end px-5 pb-4 sm:px-6 sm:pb-5">
          <form className="self-stretch sm:self-end" action={formAction}>
            <input
              hidden
              className="hidden"
              name="file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={pending || !file}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              Upload
            </Button>
          </form>
          <div className="mt-4 self-center justify-self-center text-center font-semibold">
            <article className="text-sm leading-snug">
              Close this tab once you have finished uploading your recording.
            </article>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
