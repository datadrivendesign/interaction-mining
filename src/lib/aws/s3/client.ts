"use client";

import { ListedFiles } from "@/lib/actions";
import {
  generatePresignedUploadURL,
  generateSignedCloudFrontURL,
} from "./server";
import { ActionPayload } from "@/lib/actions/types";

// Check if signed Cloudfront URL is expired with expiry url param
// Will return true if within 5 minutes of expiry
export function isCloudfrontUrlExpired(url: string): boolean {
  if (!url.includes("?") || !url.includes("Expires=")) {
    return false; // Not a signed URL or public URL
  }

  try {
    const urlParams = new URLSearchParams(url.split("?")[1]);
    const expires = urlParams.get("Expires");
    if (!expires) return false;

    const expiryTime = parseInt(expires) * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    // Consider expired if within 5 minutes of expiry
    return currentTime >= expiryTime - 5 * 60 * 1000;
  } catch {
    return false;
  }
}

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

  // use signed cloudfront url to grab file url
  let fileUrl = "";
  if (process.env.USE_MINIO_STORE === "true") {
    fileUrl = `${process.env.MINIO_ENDPOINT}/${process.env._AWS_UPLOAD_BUCKET}/${prefix}/${uploadData.fileName}`;
  } else {
    const cloudfrontUrl = `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${prefix}/${uploadData.fileName}`;
    if (prefix.includes("traces/")) {
      // traces are available publicly
      fileUrl = cloudfrontUrl;
    } else {
      // get signed url for private files
      const signedUrlRes = await generateSignedCloudFrontURL(
        uploadData.fileKey
      );
      if (signedUrlRes.ok) {
        fileUrl = signedUrlRes.data.signedUrl;
      } else {
        return {
          ok: false,
          message: signedUrlRes.message,
          data: null,
        };
      }
    }
  }

  const fileRes: ListedFiles = {
    fileKey: uploadData.fileKey,
    fileName: uploadData.fileName,
    fileUrl: fileUrl,
  };

  return {
    ok: true,
    message: "File uploaded successfully",
    data: fileRes,
  };
}
