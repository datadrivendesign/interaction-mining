"use server";

import { Prisma } from "@prisma/client";
import { isObjectIdOrHexString } from "mongoose";
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

export async function getCapture(id: string): Promise<CaptureWithTask | null> {
  let capture: CaptureWithTask | null = null;

  if (!id && !isObjectIdOrHexString(id)) {
    return null;
  }

  try {
    capture = (await prisma.capture.findUnique({
      where: {
        id,
      },
      include: {
        task: true,
      },
    })) as CaptureWithTask;
  } catch (err: any) {
    console.error(err);
    throw new Error("Failed to fetch capture.");
  }

  return capture;
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