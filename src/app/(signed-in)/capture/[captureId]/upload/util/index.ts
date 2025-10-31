import { ListedFiles } from "@/lib/actions";

import { mutate } from "swr";
import { toast } from "sonner";
import { uploadToS3 } from "@/lib/aws";
import { extname } from "path";
import { CaptureSWROperations } from "../../util";

/**
 * Handles the upload of a file to the S3 bucket
 * @param captureId - The ID of the capture
 * @param formData - The form data containing the file to upload
 * @returns The result of the file upload
 */
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
