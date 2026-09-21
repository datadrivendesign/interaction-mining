"use client";

import { ListedFiles } from "@/lib/actions";
import { createUploadUrl, generateSignedCloudFrontURL } from "./server";
import { ActionPayload } from "@/lib/actions/types";
import type { UploadPurpose } from "./upload-purpose";

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
    // Consider expired if within 5 minutes of expiry
    const expiryTime = parseInt(expires) * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    return currentTime >= expiryTime - 5 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Uploads a file straight to S3 with a presigned URL.
 *
 * The caller names a purpose and the capture or trace the file belongs to; the
 * server builds the object key, so no prefix crosses the boundary. The content
 * type and size are read off the `File` rather than passed in, because the
 * declared size is bound into the signature and any mismatch is rejected by S3.
 */
export async function uploadToS3(
  file: File,
  purpose: UploadPurpose,
  resourceId: string,
  fileName: string,
): Promise<ActionPayload<ListedFiles>> {
  const generatePresignedUpload = await createUploadUrl({
    purpose,
    resourceId,
    fileName,
    contentType: file.type,
    size: file.size,
  });

  if (!generatePresignedUpload.ok) {
    return {
      ok: false,
      message: generatePresignedUpload.message,
      data: null,
    };
  }

  const uploadData = generatePresignedUpload.data;

  const res = await fetch(uploadData.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
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
    fileUrl = `${process.env.MINIO_ENDPOINT}/${process.env._AWS_UPLOAD_BUCKET}/${uploadData.fileKey}`;
  } else {
    const cloudfrontUrl = `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${uploadData.fileKey}`;
    if (uploadData.fileKey.startsWith("traces/")) {
      // traces are available publicly
      fileUrl = cloudfrontUrl;
    } else {
      // get signed url for private files
      const signedUrlRes = await generateSignedCloudFrontURL(
        uploadData.fileKey,
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
