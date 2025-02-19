"use server";

import { Prisma } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import { prisma } from "@/lib/prisma";

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
}: GetCaptureProps): Promise<CaptureWithTask> {
  if (!id && !taskId && !otp) {
    throw new Error("Either 'id', 'taskId', or 'otp' must be provided.");
  }

  const query: Prisma.CaptureWhereInput = {
    ...(id ? { id } : {}),
    ...(taskId ? { taskId } : {}),
    ...(otp ? { otp } : {}),
  };

  try {
    let res = await prisma.capture.findFirst({
      where: query,
      include: {
        task: {
          include: {
            traces: true,
          },
        },
      },
    });

    if (!res) {
      return {} as CaptureWithTask;
    }

    return res;
  } catch (err) {
    console.error("Error fetching capture:", err);
    throw new Error("Failed to fetch capture.");
  }
}

export async function uploadCaptureToS3(captureId: string, formData: FormData) {
  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file provided");
  }

  const buffer = await file.arrayBuffer();
  const fileKey = `uploads/${captureId}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_RECORDING_UPLOAD_BUCKET!,
    Key: fileKey,
    Body: Buffer.from(buffer),
    ContentType: file.type,
  });

  await s3.send(command);

  return `https://${process.env.AWS_RECORDING_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
}
