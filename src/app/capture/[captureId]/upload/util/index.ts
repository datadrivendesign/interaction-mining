import {
  getCapture,
  getIosApp,
  deleteUploadedFile,
  generatePresignedCaptureUpload,
  getUploadedCaptureFiles,
  updateCapture,
} from "@/lib/actions";

import { mutate } from "swr";
import { toast } from "sonner";

export enum CaptureSWROperations {
  CAPTURE = "capture",
  UPLOAD_LIST = "upload-list",
}

export async function handleUploadFile(captureId: string, formData: FormData) {
  const file = formData.get("file") as File;

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
    const res = await generatePresignedCaptureUpload(captureId, file.type);

    if (!res.ok) {
      toast.error(`Upload failed: ${res.message}`);
      return {
        error: `Upload failed: ${res.message}`,
      };
    }

    const { uploadUrl, filePrefix, fileKey, fileUrl } = res.data;

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

    const updateRes = await updateCapture(captureId, { src: filePrefix });
    if (!updateRes.ok) {
      toast.error("Upload failed: Failed to update capture");
      return {
        error: "Upload failed: Failed to update capture. Please try again.",
      };
    }

    toast.success("Upload successful");

    // Optimistically update file list
    mutate(
      [CaptureSWROperations.UPLOAD_LIST, captureId],
      (prev: any) => [
        ...(prev || []),
        {
          fileKey: fileKey,
          fileName: fileKey.split("/")[fileKey.split("/").length - 1],
          fileUrl: fileUrl,
        },
      ],
      {
        optimisticData: (prev: any) => [
          ...(prev || []),
          {
            fileKey: fileKey,
            fileName: fileKey.split("/")[fileKey.split("/").length - 1],
            fileUrl: fileUrl,
          },
        ],
      }
    );
  } catch (error: any) {
    console.error("Upload failed", error);
    toast.error(`Upload failed: ${error.message}`);
  }
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
    // Fetch app data
    let appRes = await getIosApp({ appId: res.data.appId });

    if (!appRes.ok) {
      console.error("Failed to fetch app data:", appRes.message);
      toast.error("Failed to fetch app data.");
      return null;
    }
    return { capture: res.data, app: appRes.data };
  } else {
    console.error("Failed to fetch capture session:", res.message);
    toast.error("Failed to fetch capture session.");
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
