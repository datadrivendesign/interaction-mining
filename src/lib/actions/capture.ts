"use server";

import { Prisma } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { prisma } from "@/lib/prisma";
import { isValidObjectId } from "mongoose";
import { ActionPayload } from "./types";

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
}

export async function getCapture({
  id,
  taskId,
  otp,
}: GetCaptureProps): Promise<ActionPayload<CaptureWithTask>> {
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
        task: {
          include: {
            traces: true,
          },
        },
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
}

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
 */
export async function generatePresignedCaptureUpload(
  captureId: string,
  fileType: string
): Promise<ActionPayload<{ uploadUrl: string; fileUrl: string }>> {
  if (!(fileType === "video/mp4" || fileType === "video/quicktime")) {
    return {
      ok: false,
      message: "Invalid file type. Please upload an MP4 or MOV file.",
      data: null,
    };
  }

  try {
    const fileKey = `uploads/${captureId}/${Date.now()}`;

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
        fileUrl: `https://${process.env.AWS_RECORDING_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
      },
    };
  } catch (err) {
    console.error("Error generating pre-signed URL:", err);
    return { ok: false, message: "Failed to generate upload URL.", data: null };
  }
}

// export async function uploadCaptureToS3(
//   captureId: string,
//   formData: FormData
// ): Promise<ActionPayload<string>> {
//   const file = formData.get("file") as File;

//   if (!file) {
//     return {
//       ok: false,
//       message: "No file provided.",
//       data: null,
//     };
//   }

//   if (!(file.type === "video/mp4" || file.type === "video/quicktime")) {
//     return {
//       ok: false,
//       message: "Invalid file type. Please upload an MP4 or MOV file.",
//       data: null,
//     };
//   }

//   try {
//     const buffer = await file.arrayBuffer();
//     const fileKey = `uploads/${captureId}`;

//     const command = new PutObjectCommand({
//       Bucket: process.env.AWS_RECORDING_UPLOAD_BUCKET!,
//       Key: fileKey,
//       Body: Buffer.from(buffer),
//       ContentType: file.type,
//     });

//     await s3.send(command);

//     return {
//       ok: true,
//       message: "File uploaded successfully.",
//       data: `https://${process.env.AWS_RECORDING_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
//     };
//   } catch (err) {
//     console.error("Error uploading file to S3:", err);
//     return {
//       ok: false,
//       message: "Failed to upload file to S3.",
//       data: null,
//     };
//   }
// }
