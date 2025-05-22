"use server";

import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "..";
import { ActionPayload } from "@/lib/actions/types";

/**
 * Generates a presigned URL for uploading a file to S3.
 * @param prefix The prefix for the S3 object key.
 * @param key The S3 object key.
 * @returns The presigned URL for uploading the file.
 */
export async function generatePresignedUploadURL(
  prefix: string,
  fileName: string,
  contentType: string
): Promise<ActionPayload<any>> {
  const command = new PutObjectCommand({
  Bucket: process.env.AWS_UPLOAD_BUCKET!,
    Key: `${prefix}/${fileName}`,
    ContentType: contentType,
  });

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return {
      ok: true,
      message: "Pre-signed upload URL generated.",
      data: {
        uploadUrl: url,
        filePrefix: prefix,
        fileKey: `${prefix}/${fileName}`,
        fileUrl: `https://${process.env.AWS_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${prefix}/${fileName}`,
      },
    };
  } catch (err) {
    console.error("Error generating presigned URL", err);
    return {
      ok: false,
      message: "Failed to generate presigned URL",
      data: null,
    };
  }
}

/**
 * Fetches a list of files from S3.
 * @param key The S3 object key to fetch.
 * @returns
 */
export async function getFromS3(key: string): Promise<ActionPayload<any>> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_UPLOAD_BUCKET!,
      Prefix: key,
    });
    const files = await s3.send(command);

    if (!files.Contents || files.Contents.length === 0) {
      return {
        ok: true,
        message: "File not found",
        data: [],
      };
    }

    return {
      ok: true,
      message: "File(s) found",
      data: files.Contents,
    };
  } catch (err) {
    console.error("Error fetching file from S3:", err);
    return {
      ok: false,
      message: "Failed to fetch file",
      data: null,
    };
  }
}

/**
 * Deletes an uploaded file from S3.
 * @param fileKey The S3 object key of the file to delete.
 * @returns ActionPayload
 */
export async function deleteFromS3(fileKey: string) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_UPLOAD_BUCKET!,
      Prefix: fileKey,
    });

    const response = await s3.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return { ok: false, message: "File not found.", data: null };
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_UPLOAD_BUCKET!,
      Key: fileKey,
    });

    let res = await s3.send(deleteCommand);

    if (res.$metadata.httpStatusCode !== 204) {
      return { ok: false, message: "Failed to delete file.", data: null };
    }

    return { ok: true, message: "File deleted.", data: null };
  } catch (err) {
    console.error("Error deleting file:", err);
    return { ok: false, message: "Failed to delete file.", data: null };
  }
}

/**
 * A server version of uploadToS3. This is needed because Android 
 * upload API route is running on a server component.
 * @param file Android screen JSON data formed into a File
 * @param prefix S3 bucket prefix
 * @param key S3 bucket key
 * @param contentType MIME type of uploaded content (should be JSON normally)
 * @returns 
 */
export async function uploadAndroidAPIDataToS3(
  file: File,
  prefix: string,
  key: string,
  contentType: string
): Promise<ActionPayload<any>> {
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

  return {
    ok: true,
    message: "File uploaded successfully",
    data: uploadData,
  };
}