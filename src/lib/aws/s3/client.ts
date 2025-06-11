"use client";

import { ListedFiles } from "@/lib/actions";
import { generatePresignedUploadURL } from "./server";
import { ActionPayload } from "@/lib/actions/types";

export async function uploadToS3(
  file: File,
  prefix: string,
  key: string,
  contentType: string
): Promise<ActionPayload<ListedFiles>> {
  const generatePresignedUpload = await generatePresignedUploadURL(
    prefix,
    key,
    contentType
  );

  if (!generatePresignedUpload.ok) {
    return {
      ok: false,
      message: "Failed to generate presigned URL",
      data: null,
    };
  }

  const uploadData = generatePresignedUpload.data;

  const res = await fetch(uploadData.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });

  if (!res.ok) {
    console.error("S3 upload failed", await res.text());
    return {
      ok: false,
      message: "Failed to upload file",
      data: null,
    };
  }

  const fileRes: ListedFiles = {
    fileKey: uploadData.fileKey,
    fileName: uploadData.fileName,
    fileUrl: uploadData.fileUrl,
  };

  return {
    ok: true,
    message: "File uploaded successfully",
    data: fileRes,
  };
}
