import { ListedFiles } from "@/lib/actions";
import { deleteFromS3, isCloudfrontUrlExpired, listFromS3 } from "@/lib/aws";

import { toast } from "sonner";
import { mutate, SWRConfiguration } from "swr";

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
        if (!prevData) {
          return [];
        }
        return prevData.filter((file: any) => file.fileKey !== fileKey);
      },
      {
        optimisticData: (prevData: any) => {
          if (!prevData) {
            return [];
          }
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
  let res = await listFromS3(fileKey, true);

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch uploaded files", res.message);
    toast.error("Failed to fetch uploaded files");
    return [];
  }
}

export const getSWRConfig = (
  operation: CaptureSWROperations,
  prefix: string
): SWRConfiguration<ListedFiles[]> => ({
  refreshInterval: 5000,
  compare: (prevFiles, currFiles) => {
    if (!prevFiles || !currFiles) {
      // if one is undefined and the other is not, return false
      if (!prevFiles && currFiles) {
        return false;
      }
      if (prevFiles && !currFiles) {
        return false;
      }
      return true;
    }
    // if both are defined, check if the file keys are the same
    if (prevFiles.length !== currFiles.length) {
      return false;
    }
    // check if file keys are the same
    const prevFileKeys = prevFiles.map((file) => file.fileKey);
    const currFileKeys = currFiles.map((file) => file.fileKey);
    if (prevFileKeys.every((key, index) => key === currFileKeys[index])) {
      // check if any file urls are expired
      if (prevFiles.some((file) => isCloudfrontUrlExpired(file.fileUrl))) {
        return false;
      }
      return true;
    }
    return false;
  },
});
