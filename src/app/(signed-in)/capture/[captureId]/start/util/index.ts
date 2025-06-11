import { deleteFromS3, listFromS3 } from "@/lib/aws";

import { toast } from "sonner";
import { mutate } from "swr";

export enum CaptureSWROperations {
  CAPTURE = "capture",
  UPLOAD_LIST = "upload-list",
  TRANSCODE_LIST = "transcode-list",
}

export async function handleDeleteFile(captureId: string, fileKey: string) {
  let res = await deleteFromS3(fileKey);

  if (res.ok) {
    toast.success("File deleted");
    mutate(
      [CaptureSWROperations.UPLOAD_LIST, captureId],
      (prevData: any) => {
        if (!prevData) { return []; }
        return prevData.filter((file: any) => file.fileKey !== fileKey);
      },
      {
        optimisticData: (prevData: any) => {
          if (!prevData) { return []; }
          return prevData.filter((file: any) => file.fileKey !== fileKey);
        },
      }
    );
  } else {
    console.error("Failed to delete file", res.message);
    toast.error("Failed to delete file");
  }
}

export async function fileFetcher([_, fileKey]: [string, string]) {
  let res = await listFromS3(fileKey);

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch uploaded files", res.message);
    toast.error("Failed to fetch uploaded files");
    return [];
  }
}
