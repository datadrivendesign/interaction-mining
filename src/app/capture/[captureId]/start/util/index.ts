import {
  getCapture,
  getUploadedCaptureFiles,
  deleteUploadedFile,
} from "@/lib/actions";

import { toast } from "sonner";
import { mutate } from "swr";

export enum CaptureSWROperations {
  CAPTURE = "capture",
  UPLOAD_LIST = "upload-list",
}

export async function handleDeleteFile(captureId: string, fileKey: string) {
  let res = await deleteUploadedFile(fileKey);

  if (res.ok) {
    toast.success("File deleted");
    mutate(
      [CaptureSWROperations.UPLOAD_LIST, captureId],
      (prevData: any) => {
        return prevData.filter((file: any) => file.key !== fileKey);
      },
      {
        optimisticData: (prevData: any) => {
          return prevData.filter((file: any) => file.key !== fileKey);
        },
      }
    );
  } else {
    console.error("Failed to delete file", res.message);
    toast.error("Failed to delete file");
  }
}

export async function captureFetcher([_, captureId]: [string, string]) {
  let res = await getCapture({ id: captureId });

  if (res.ok) {
    return res.data;
  } else {
    toast.error("Failed to fetch capture. Try again.");
    return null;
  }
}

export async function fileFetcher([_, captureId]: [string, string]) {
  let res = await getUploadedCaptureFiles(captureId);

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch uploaded files", res.message);
    toast.error("Failed to fetch uploaded files");
    return [];
  }
}
