import { ListedFiles } from "@/lib/actions";

import { mutate, SWRConfiguration } from "swr";
import { toast } from "sonner";
import {
  deleteFromS3,
  generateSignedCloudFrontURL,
  isCloudfrontUrlExpired,
  listFromS3,
  uploadToS3,
} from "@/lib/aws";
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

    console.log("File uploaded successfully");

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

export async function fileFetcher(
  [_, captureId]: [string, string],
  cachedData?: ListedFiles[]
) {
  let res = await listFromS3(`uploads/${captureId}`, false);
  if (!res.ok) {
    console.error("Failed to fetch uploaded files", res.message);
    toast.error("Failed to fetch uploaded files");
    return [];
  }
  // check if cached data matches current data and needs new signed url
  const processedData = await Promise.all(
    res.data.map(async (file) => {
      const cachedFile = cachedData?.find(
        (cached) => cached.fileKey === file.fileKey
      );
      // check if cached file is expired or not signed
      if (cachedFile && cachedFile.fileUrl.includes("?")) {
        const isExpired = isCloudfrontUrlExpired(cachedFile.fileUrl);
        if (!isExpired) {
          return { ...file, fileUrl: cachedFile.fileUrl };
        }
      }
      // Generate new signed URL
      const signedUrlRes = await generateSignedCloudFrontURL(file.fileKey);
      if (signedUrlRes.ok) {
        return { ...file, fileUrl: signedUrlRes.data.signedUrl };
      } else {
        return file;
      }
    })
  );

  return processedData;
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
