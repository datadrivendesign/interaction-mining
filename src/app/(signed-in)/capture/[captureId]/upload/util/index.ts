import {
  getCapture,
  getIosApp,
  getCaptureFiles,
  ListedFiles,
} from "@/lib/actions";

import { mutate } from "swr";
import { toast } from "sonner";
import { deleteFromS3, listFromS3, uploadToS3 } from "@/lib/aws";
import { extname } from "path";

export enum CaptureSWROperations {
  CAPTURE = "capture",
  UPLOAD_LIST = "upload-list",
}

export async function handleUploadFile(captureId: string, formData: FormData) {
  let file = formData.get("file") as File;

  if (!captureId) {
    toast.error("Unexpected error. Please try again.");
    return { error: "Unexpected error. Please try again." };
  }

  // Check if file is present
  if (!file) return;

  // Check if file type is valid
  if (!(file.type === "video/mp4" || file.type === "video/quicktime")) {
    toast.error("Invalid file type. Please upload an MP4 or MOV file.");
    return {
      error: "Invalid file type. Please upload an MP4 or MOV file.",
    };
  }

  try {
    const prefix = `uploads/${captureId}`;
    const res = await uploadToS3(
      file,
      prefix,
      Date.now().toString() + extname(file.name),
      file.type
    );

    if (!res.ok) {
      toast.error(`Upload failed: ${res.message}`);
      return {
        error: `Upload failed: ${res.message}`,
      };
    }

    toast.success("File uploaded");

    console.log("File uploaded successfully", res.data);

    // Optimistically update file list
    mutate(
      [CaptureSWROperations.UPLOAD_LIST, captureId],
      (prev: ListedFiles[] | undefined) => [
        ...(prev || []),
        {
          fileKey: res.data.fileKey,
          fileName: res.data.fileName,
          fileUrl: res.data.fileUrl,
        },
      ]
    );
  } catch (error: any) {
    console.error("Upload failed", error);
    toast.error(`Upload failed: ${error.message}`);
  }
}

export async function handleDeleteFile(captureId: string, fileKey: string) {
  let res = await deleteFromS3(fileKey);

  if (res.ok) {
    toast.success("File deleted");
    mutate(
      [CaptureSWROperations.UPLOAD_LIST, captureId],
      (prevData: ListedFiles[] | undefined) => {
        if (!prevData) return [];
        return prevData.filter((file: any) => file.fileKey !== fileKey);
      },
      {
        optimisticData: (prevData: ListedFiles[] | undefined) => {
          if (!prevData) return [];
          return prevData.filter((file: any) => file.fileKey !== fileKey);
        },
      }
    );
  } else {
    console.error("Failed to delete file", res.message);
    toast.error("Failed to delete file");
  }
}

export async function fileFetcher([_, captureId]: [string, string]) {
  let res = await listFromS3(`uploads/${captureId}`);

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch uploaded files", res.message);
    toast.error("Failed to fetch uploaded files");
    return [];
  }
}
