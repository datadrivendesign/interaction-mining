import { ListedFiles } from "@/lib/actions";

import { mutate } from "swr";
import { toast } from "sonner";
import { uploadToS3 } from "@/lib/aws";
import { UploadPurpose } from "@/lib/aws/s3/upload-purpose";
import type { UploadState } from "@/lib/aws/s3/put-with-retry";
import { extname } from "path";
import { CaptureSWROperations } from "../../util";

/**
 * Handles the upload of a file to the S3 bucket
 * @param captureId - The ID of the capture
 * @param formData - The form data containing the file to upload
 * @param options - Progress reporting and cancellation
 * @returns The result of the file upload
 */
export async function handleUploadFile(
  captureId: string,
  formData: FormData,
  options: {
    signal?: AbortSignal;
    onState?: (state: UploadState) => void;
  } = {},
) {
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
    const res = await uploadToS3(
      file,
      UploadPurpose.CAPTURE_VIDEO,
      captureId,
      Date.now().toString() + extname(file.name),
      options,
    );

    if (!res.ok) {
      // The worker pressed Cancel; surfacing that as an error would be wrong.
      if (res.kind === "cancelled") return;
      toast.error(`Upload failed: ${res.message}`);
      return {
        error: `Upload failed: ${res.message}`,
      };
    }

    // The object is stored either way. A missing preview is a presentation
    // problem, so it must never read as an upload failure — telling a worker
    // to re-upload a file S3 already has is what this fix exists to stop.
    if (res.data.previewUnavailable) {
      toast.success("File uploaded. Preview will appear shortly.");
    } else {
      toast.success("File uploaded");
    }

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
      ],
    );

    // A degraded preview is recoverable by re-reading the list from S3, which
    // is the source of truth for what has been uploaded.
    if (res.data.previewUnavailable) {
      mutate([CaptureSWROperations.UPLOAD_LIST, captureId]);
    }
  } catch (error: any) {
    console.error("Upload failed", error);
    toast.error(`Upload failed: ${error.message}`);
  }
}
