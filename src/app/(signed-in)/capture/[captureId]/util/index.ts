import { ListedFiles } from "@/lib/actions";
import { deleteFromS3, listFromS3 } from "@/lib/aws";

import { toast } from "sonner";
import { mutate, SWRConfiguration } from "swr";

export enum CaptureSWROperations {
  CAPTURE = "capture",
  UPLOAD_LIST = "upload-list",
  TRANSCODE_LIST = "transcode-list",
}

/**
 * Handles the deletion of a file from the S3 bucket
 * @param captureId - The ID of the capture
 * @param fileKey - The key of the file to delete
 */
export async function handleDeleteFile(captureId: string, fileKey: string) {
  let res = await deleteFromS3(fileKey);

  if (res.ok) {
    toast.success("File deleted");
    mutate(
      [CaptureSWROperations.UPLOAD_LIST, captureId],
      (prevData: ListedFiles[] | undefined) => {
        if (!prevData) {
          return [];
        }
        return prevData.filter((file: ListedFiles) => file.fileKey !== fileKey);
      },
      {
        optimisticData: (prevData: ListedFiles[] | undefined) => {
          if (!prevData) {
            return [];
          }
          return prevData.filter(
            (file: ListedFiles) => file.fileKey !== fileKey
          );
        },
      }
    );
  } else {
    console.error("Failed to delete file", res.message);
    toast.error("Failed to delete file");
  }
}

/**
 * Fetches the list of files from the S3 bucket
 * @param [operation, captureId] - The operation and ID of the capture
 * @returns The list of files
 */
export async function fileFetcher([_, captureId]: [string, string]): Promise<
  ListedFiles[]
> {
  console.log("[FILE FETCHER] Fetching files for capture", captureId);
  let res = await listFromS3(`uploads/${captureId}`, true);

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch uploaded files", res.message);
    toast.error("Failed to fetch uploaded files");
    return [];
  }
}

/**
 * Configures the SWR for the upload list
 * @param operation - The operation to perform
 * @param captureId - The ID of the capture
 * @returns boolean indicating if the data has changed
 */
export const getSWRConfig = (
  operation: CaptureSWROperations,
  captureId: string
): SWRConfiguration<ListedFiles[]> => ({
  refreshInterval: 8000,
  dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
  compare: (prevFiles, currFiles) => {
    const prefix = `uploads/${captureId}`;
    const result = (() => {
      if (!prevFiles || !currFiles) {
        if (!prevFiles && !currFiles) {
          return true;
        }
        // if one is undefined and the other is not, return false
        return false;
      }
      // if both are defined, check if the file keys are the same
      if (prevFiles.length !== currFiles.length) {
        return false;
      }
      // Order-insensitive comparison of file keys only
      const prevKeys = new Set(prevFiles.map((f) => f.fileKey));
      for (const f of currFiles) {
        if (!prevKeys.has(f.fileKey)) return false;
      }
      return true;
    })();

    // Log comparison result (SWR may call compare multiple times during validation cycles)
    // Consider removing in production if too verbose
    console.log("[SWR COMPARE]", {
      operation,
      prefix,
      prevLength: prevFiles?.length || 0,
      currLength: currFiles?.length || 0,
      result,
    });

    return result;
  },
});
