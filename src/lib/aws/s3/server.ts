"use server";

import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Generates a presigned URL for uploading a file to S3.
 * @param prefix The prefix for the S3 object key.
 * @param key The S3 object key.
 * @returns The presigned URL for uploading the file.
 */
export async function generatePresignedUploadURL(
  prefix: string,
  key: string,
  contentType: string
) {
  "use server";
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_UPLOAD_BUCKET!,
    Key: `${prefix}/${key}`,
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
        fileKey: `${prefix}/${key}`,
        fileUrl: `https://${process.env.AWS_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${prefix}/${key}`,
      },
    };
  } catch (err) {
    console.error("Error generating presigned URL", err);
    throw new Error("Failed to generate presigned URL");
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
