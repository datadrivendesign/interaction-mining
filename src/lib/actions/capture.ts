"use server";

import { Prisma } from "@prisma/client";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { prisma } from "@/lib/prisma";
import { isValidObjectId } from "mongoose";
import { ActionPayload } from "./types";
import { unstable_cache } from "next/cache";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export type CaptureWithTask = Prisma.CaptureGetPayload<{
  include: { task: true };
}>;

interface GetCaptureProps {
  id?: string;
  taskId?: string;
  otp?: string;
  includes?: {
    app?: boolean;
    task?: boolean;
  };
}


/**
 * Fetches a capture from the database.
 * @param id Id of the capture to fetch.
 * @param taskId Id of the task to fetch the capture for.
 * @param otp OTP of the capture to fetch.
 * @returns ActionPayload
 */
export const getCapture = unstable_cache(
  async (
    { id, taskId, otp, includes }: GetCaptureProps,
  ): Promise<ActionPayload<CaptureWithTask>> => {
    const { task = false, app = false } = includes || {};

    if (!id && !taskId && !otp) {
      return { ok: false, message: "No search criteria provided.", data: null };
    }

    if (id && !isValidObjectId(id)) {
      return { ok: false, message: "Invalid captureId provided.", data: null };
    }

    if (taskId && !isValidObjectId(taskId)) {
      return { ok: false, message: "Invalid taskId provided.", data: null };
    }

    const query: Prisma.CaptureWhereInput = {
      ...(id ? { id } : {}),
      ...(taskId ? { taskId } : {}),
      ...(otp ? { otp } : {}),
    };

    try {
      const capture = await prisma.capture.findFirst({
        where: query,
        include: {
          app,
          task,
        },
      });

      if (!capture) {
        return { ok: false, message: "Capture not found.", data: null };
      }

      return { ok: true, message: "Capture found.", data: capture };
    } catch (err) {
      console.error("Error fetching capture:", err);
      return { ok: false, message: "Failed to fetch capture.", data: null };
    }
  },
  undefined,
  { revalidate: 10 }
);

/**
 * Updates a capture in the database.
 * @param id Id of the capture to update.
 * @param data Data to update the capture with.
 * @returns ActionPayload
 */
export async function updateCapture(
  id: string,
  data: Prisma.CaptureUpdateInput
) {
  try {
    const capture = await prisma.capture.update({
      where: { id },
      data,
    });

    return { ok: true, message: "Capture updated.", data: capture };
  } catch (err) {
    console.error("Error updating capture:", err);
    return { ok: false, message: "Failed to update capture.", data: null };
  }
}

/**
 * Generates a pre-signed URL for direct S3 upload.
 * @param captureId The ID of the capture to upload the file to.
 * @param fileType The MIME type of the file to upload.
 * @returns ActionPayload
 */
export async function generatePresignedCaptureUpload(
  captureId: string,
  fileType: string
): Promise<
  ActionPayload<{
    uploadUrl: string;
    fileKey: string;
    filePrefix: string;
    fileUrl: string;
  }>
> {
  if (!(fileType === "video/mp4" || fileType === "video/quicktime")) {
    return {
      ok: false,
      message: "Invalid file type. Please upload an MP4 or MOV file.",
      data: null,
    };
  }

  try {
    const fileKey = `uploads/${captureId}/${Date.now()}.${fileType.split("/")[fileType.split("/").length - 1]}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_RECORDING_UPLOAD_BUCKET!,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return {
      ok: true,
      message: "Pre-signed upload URL generated.",
      data: {
        uploadUrl,
        filePrefix: `uploads/${captureId}/`,
        fileKey,
        fileUrl: `https://${process.env.AWS_RECORDING_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
      },
    };
  } catch (err) {
    console.error("Error generating pre-signed URL:", err);
    return { ok: false, message: "Failed to generate upload URL.", data: null };
  }
}

/**
 * Generates a pre-signed URL for direct S3 upload.
 * @param captureId The ID of the capture to upload the file to.
 * @param fileType The MIME type of the file to upload.
 * @returns ActionPayload
 */
export async function generatePresignedCaptureUploadImg(
  captureId: string,
  fileType: string
): Promise<
  ActionPayload<{
    uploadUrl: string;
    fileKey: string;
    filePrefix: string;
    fileUrl: string;
  }>
> {
  if (!(fileType === "image/png")) {
    return {
      ok: false,
      message: "Invalid file type. Please upload an PNG",
      data: null,
    };
  }

  try {
    const fileKey = `uploads/${captureId}/${Date.now()}.${fileType.split("/")[fileType.split("/").length - 1]}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_RECORDING_UPLOAD_BUCKET!,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return {
      ok: true,
      message: "Pre-signed upload URL generated.",
      data: {
        uploadUrl,
        filePrefix: `uploads/${captureId}/`,
        fileKey,
        fileUrl: `https://${process.env.AWS_RECORDING_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
      },
    };
  } catch (err) {
    console.error("Error generating pre-signed URL:", err);
    return { ok: false, message: "Failed to generate upload URL.", data: null };
  }
}

/**
 * Deletes an uploaded file from S3.
 * @param fileKey The S3 object key of the file to delete.
 * @returns ActionPayload
 */
export async function deleteUploadedFile(fileKey: string) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_RECORDING_UPLOAD_BUCKET!,
      Prefix: fileKey,
    });

    const response = await s3.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return { ok: false, message: "File not found.", data: null };
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_RECORDING_UPLOAD_BUCKET!,
      Key: fileKey,
    });

    let res = await s3.send(deleteCommand);

    console.log("Delete response:", res);

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
 * Fetches a list of uploaded files for a given capture ID from S3.
 * @param captureId The ID of the capture to fetch uploaded files for.
 * @returns ActionPayload
 */
export async function getUploadedCaptureFiles(captureId: string) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_RECORDING_UPLOAD_BUCKET!,
      Prefix: `uploads/${captureId}/`,
    });

    const response = await s3.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return { ok: true, message: "No uploaded files found.", data: [] };
    }

    // filter to only show shallow keys
    response.Contents = response.Contents.filter((file) => file.Key!.split("/").length === 3);

    // Map the file URLs from S3 object keys
    const fileUrls = response.Contents.map((file) => ({
      fileKey: file.Key!,
      fileName: file.Key!.split("/")[file.Key!.split("/").length - 1],
      fileUrl: `https://${process.env.AWS_RECORDING_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key!}`,
    }));

    return {
      ok: true,
      message: "Uploaded files fetched successfully.",
      data: fileUrls,
    };
  } catch (err) {
    console.error("Error fetching uploaded files:", err);
    return {
      ok: false,
      message: "Failed to fetch uploaded files.",
      data: [],
    };
  }
}
