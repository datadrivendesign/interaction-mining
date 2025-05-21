"use client";

import { generatePresignedUploadURL } from "./server";
import { ActionPayload } from "@/lib/actions/types";

export async function uploadToS3(
  file: File,
  prefix: string,
  key: string,
  contentType: string
): Promise<ActionPayload<any>> {
  const generatePresignedUpload = await generatePresignedUploadURL(
    prefix,
    key,
    "image/png"
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

  return {
    ok: true,
    message: "File uploaded successfully",
    data: uploadData,
  };
}
