"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, File, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getCapture, getIosAppById } from "@/lib/actions";
import {
  CaptureWithTask as Capture,
  uploadCaptureToS3,
} from "@/lib/actions/capture";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Page() {
  const params = useParams();
  const captureId = params.captureId as string;

  const [capture, setCapture] = useState<Capture>({} as Capture);
  const [app, setApp] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

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

  const handleUpload = async (_: React.MouseEvent<HTMLButtonElement>) => {
    const file = fileInputRef.current?.files?.[0]; // Correctly access the file input
    if (!file) return;

    setUploading(true);

    toast.info("Uploading file...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const url = await uploadCaptureToS3(captureId, formData);
      setUploadedUrl(url);
      toast.success("Upload successful");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    getCapture({ id: captureId }).then((capture) => {
      if (!capture) {
        throw new Error("Capture not found.");
      }

      console.log("Capture", capture);
      setCapture(capture);

      getIosAppById({ appId: capture.appId })
        .then((app: any) => {
          setApp(app);
        })
        .catch((error: any) => {
          throw new Error(error);
        });
    });
  }, [captureId]);

  return (
    <div className="flex flex-col w-dvw min-h-dvh items-center justify-start md:justify-center p-8 md:p-16 gap-6">
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex justify-center items-center size-8 mr-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white text-sm">
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
            <div className="flex flex-col sm:flex-row justify-center sm:justify-start items-center w-full p-4 md:p-6 gap-4 bg-neutral-100 dark:bg-neutral-900 rounded-2xl">
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
                <Link href={app?.url ?? "/"}>
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
            Complete the assigned task
          </CardTitle>
          <CardDescription hidden>Complete the task</CardDescription>
        </CardHeader>
        <CardContent>
          <article className="prose prose-neutral dark:prose-invert leading-snug">
            {capture?.task ? (
              <p>
                {capture?.task?.description
                  ? capture?.task?.description
                  : "No description provided."}
              </p>
            ) : (
              <>
                <div className="w-full h-4 bg-neutral-500 dark:bg-neutral-400 animate-pulse rounded"></div>
              </>
            )}
          </article>
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
          <CardDescription hidden>Upload your task recording</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "flex flex-col justify-center items-center w-full p-4 md:p-6 border-2 border-dashed border-neutral-200 hover:border-neutral-500 dark:border-neutral-800 dark:hover:border-neutral-400 rounded-2xl text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 hover:dark:text-neutral-200 transition-colors duration-150 ease-in-out cursor-pointer",
              file ? "border-solid" : "border-dashed"
            )}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              hidden
              className="hidden"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <span className="inline-flex flex-col items-center text-sm">
              {file ? (
                <File className="size-8 mb-2" />
              ) : (
                <Upload className="size-8 mb-2" />
              )}
              {file ? `${file.name}` : "Tap to select or drop your file here"}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Upload
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
