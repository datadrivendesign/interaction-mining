"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, File, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

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

import { getCapture, getIosApp } from "@/lib/actions";
import {
  CaptureWithTask as Capture,
  generatePresignedCaptureUpload,
  updateCapture,
} from "@/lib/actions/capture";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function handleUpload(prevState: any, formData: FormData) {
  const captureId = formData.get("captureId") as string;
  const file = formData.get("file") as File;

  if (!captureId) {
    toast.error("Unexpected error. Please try again.");
    return { error: "Unexpected error. Please try again." };
  }

  if (!file) return;

  try {
    const res = await generatePresignedCaptureUpload(captureId, file.type);

    if (!res.ok) {
      toast.error(`Upload failed: ${res.message}`);
      return {
        error: `Upload failed: ${res.message}`,
      };
    }

    const { uploadUrl, fileUrl } = res.data;

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) {
      toast.error("Upload failed: Failed to upload file");
      return {
        error: "Upload failed: Failed to upload file. Please try again.",
      };
    }

    const updateRes = await updateCapture(captureId, { src: fileUrl });
    if (!updateRes.ok) {
      toast.error("Upload failed: Failed to update capture");
      return {
        error: "Upload failed: Failed to update capture. Please try again.",
      };
    }

    toast.success("Upload successful");
  } catch (error: any) {
    console.error("Upload failed", error);
    toast.error(`Upload failed: ${error.message}`);
  }
}

export default function Page() {
  const params = useParams();
  const captureId = params.captureId as string;

  const [capture, setCapture] = useState<Capture>({} as Capture);
  const [app, setApp] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const [state, formAction, pending] = useActionState(handleUpload, null);

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

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  useEffect(() => {
    getCapture({ id: captureId })
      .then((capture) => {
        if (!capture.ok) {
          notFound();
        } else {
          const { data } = capture;
          setCapture(data);

          getIosApp({ appId: data.appId })
            .then((app: any) => {
              setApp(app);
            })
            .catch((error: any) => {
              throw new Error(error);
            });
        }
      })
      .catch((error) => {
        console.error("Failed to fetch capture", error);
        notFound();
      });
  }, [captureId]);

  return (
    <div className="flex flex-col w-dvw min-h-dvh items-center justify-start md:justify-center p-4 md:p-16 gap-4">
      {/* <h1 className="text-4xl font-bold my-4">Record Capture</h1> */}
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex justify-center items-center size-8 mr-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white text-sm tabular-nums">
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
                {app?.icon ? (
                  <Image
                    className="w-full rounded-3xl object-contain aspect-square"
                    src={app?.icon}
                    alt={`${app.title} icon`}
                    width={0}
                    height={0}
                    sizes={"100vw"}
                  />
                ) : (
                  <div className="w-full rounded-3xl object-contain aspect-square bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                )}
              </figure>
              <div className="flex flex-col justify-between items-center sm:items-start">
                <div className="flex flex-col items-center sm:items-start mb-4">
                  {app?.title ? (
                    <h2 className="font-semibold leading-snug">{app?.title}</h2>
                  ) : (
                    <span className="w-24 h-4.5 md:h-5 bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-3"></span>
                  )}
                  {app?.developer ? (
                    <p className="text-sm md:text-base font-medium text-neutral-500 dark:text-neutral-400">
                      {app?.developer}
                    </p>
                  ) : (
                    <span className="w-24 h-4 bg-neutral-200 dark:bg-neutral-800 animate-pulse"></span>
                  )}
                </div>
                <Link href={app?.url ?? "/"} target="_blank">
                  <button
                    disabled={!app?.url}
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500 disabled:bg-neutral-500 text-white text-sm md:text-base font-medium"
                  >
                    <ExternalLink className="size-3.5 md:size-4 mr-1" />{" "}
                    Install/Open
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex justify-center items-center size-8 mr-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white text-sm">
              2
            </span>{" "}
            Record the following task
          </CardTitle>
          <CardDescription hidden>Record the following task</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            {capture?.task ? (
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

          <Accordion type="single" collapsible className="px-4 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I record my screen?</AccordionTrigger>
              <AccordionContent>
                <article className="prose prose-neutral dark:prose-invert leading-snug mb-4">
                  <p>
                    Consult your phone or tablet&rsquo;s documentation to learn how to
                    record your screen.
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
            <span className="inline-flex justify-center items-center size-8 mr-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white text-sm">
              3
            </span>{" "}
            Upload your task recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            Upload the screen recording.
          </p>
          {state?.error && (
            <div className="border-2 border-red-500 bg-red-500/10 rounded-2xl px-4 py-2 mb-4">
              <span className="text-red-500 dark:text-red-400 text-sm">
                {state.error}
              </span>
            </div>
          )}
          <div
            className={cn(
              "flex flex-col justify-center items-center w-full p-4 md:p-6 border-2 border-dashed border-neutral-200 hover:border-neutral-500 dark:border-neutral-800 dark:hover:border-neutral-400 rounded-2xl text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 hover:dark:text-neutral-200 transition-colors duration-150 ease-in-out cursor-pointer",
              file ? "border-solid" : "border-dashed"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <span className="inline-flex flex-col items-center text-center text-sm">
              {file ? (
                <File className="size-8 mb-2" />
              ) : (
                <Upload className="size-8 mb-2" />
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
            <input type="hidden" name="captureId" value={captureId} />
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
    </div>
  );
}
