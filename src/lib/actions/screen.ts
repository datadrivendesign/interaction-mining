"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, Screen } from "@prisma/client";
import { isObjectIdOrHexString } from "mongoose";
import { ActionPayload } from "./types";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { uploadAndroidAPIDataToS3 } from "../aws";

const s3 = new S3Client({
  region: process.env._AWS_REGION!,
  forcePathStyle: process.env.USE_MINIO_STORE === "true" ? true : false,
  // conditional: only define endpoint if using minio store, otherwise ignore 
  ...(process.env.USE_MINIO_STORE === "true" && {
    endpoint: process.env.MINIO_ENDPOINT,
  }),
  credentials: {
    accessKeyId: process.env._AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env._AWS_SECRET_ACCESS_KEY!,
  },
});

interface GetScreenParams {
  limit?: number;
  page?: number;
}

export async function getScreens({
  limit = 10,
  page = 1,
}: GetScreenParams = {}) {
  let screen: Screen[] = [];

  try {
    screen = await prisma.screen.findMany({
      take: limit,
      skip: (page - 1) * limit,
    });
  } catch (err: any) {
    console.error(err);
    throw new Error("Failed to fetch screens.");
  }

  return screen;
}

export async function getScreen(id: string): Promise<Screen | null> {
  let screen: Screen | null = {} as Screen;

  if (!id || !isObjectIdOrHexString(id)) {
    return null;
  }

  try {
    screen = await prisma.screen.findUnique({
      where: {
        id,
      },
    });
  } catch (err: any) {
    console.error(err);
    throw new Error("Failed to fetch screen.");
  }

  return screen;
}

export async function createScreen(data: Screen): Promise<Screen | null> {
  let screen: Screen | null = {} as Screen;
  try {
    screen = await prisma.screen.create({ data });
  } catch (err: any) {
    console.error(err);
    throw new Error("Failed to create screen.");
  }
  return screen;
}

export async function updateScreen(
  id: string,
  data: Partial<Screen>
): Promise<ActionPayload<Screen>> {
  let screen: Screen | null = {} as Screen;

  if (!id || !isObjectIdOrHexString(id)) {
    return {
      ok: false,
      message: "Invalid screen ID",
      data: null,
    };
  }

  const query: Prisma.ScreenWhereUniqueInput = {
    id,
  };

  try {
    screen = await prisma.screen.update({
      where: query,
      data,
    });
  } catch (err: any) {
    console.error(err);
    return {
      ok: false,
      message: "Failed to update screen.",
      data: null,
    };
  }

  if (!screen) {
    return {
      ok: false,
      message: "Screen not found.",
      data: null,
    };
  }

  return {
    ok: true,
    message: "Screen updated successfully.",
    data: screen,
  };
}

/**
 * Generates a pre-signed URL for direct S3 upload of view hierarchy JSON.
 * @param captureId The ID of the capture to upload the file to.
 * @param fileType The MIME type of the file to upload.
 * @returns ActionPayload
 */
export async function generatePresignedVHUpload(
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
  if (!(fileType === "application/json")) {
    return {
      ok: false,
      message: "Invalid file type. Please upload a JSON",
      data: null,
    };
  }

  try {
    const fileKey = `uploads/${captureId}/vhs/${Date.now()}.${fileType.split("/")[fileType.split("/").length - 1]}`;

    const command = new PutObjectCommand({
      Bucket: process.env._AWS_UPLOAD_BUCKET!,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return {
      ok: true,
      message: "View Hierarchy uploaded to storage",
      data: {
        uploadUrl,
        filePrefix: `uploads/${captureId}/`,
        fileKey,
        fileUrl: process.env.USE_MINIO_STORE === "true" 
          ? `${process.env.MINIO_ENDPOINT}/${process.env._AWS_UPLOAD_BUCKET}/${fileKey}`
          : `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${fileKey}`,
      },
    };
  } catch (err) {
    console.error("Error uploading image to storage:", err);
    return { ok: false, message: "Failed to upload image.", data: null };
  }
}

/**
 * Handles the upload of an Android screen and its view hierarchy.
 * @param data The data containing screen information.
 * @returns ActionPayload with the screen ID or error message.
 */
export async function handleAndroidScreenUpload(data: {
  vh: string;
  img: string;
  created: string;
  gesture: {
    type?: string;
    scrollDeltaX?: number;
    scrollDeltaY?: number;
    x?: number;
    y?: number;
  };
  captureId: string;
}): Promise<ActionPayload<{ url: string, fileKey: string }>> {
  try {
    // Upload files to S3
    // create s3 json
    const file = new File([JSON.stringify(data)], `${data.created}.json`, {
      type: "application/json",
    });
    const [res] = await Promise.all([
      uploadAndroidAPIDataToS3(
        file,
        `uploads/${data.captureId}`,
        `${data.created}.json`,
        "application/json"
      ),
    ]);

    if (!res.ok) {
      return {
        ok: false,
        message: "Failed to upload view hierarchy",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Screen uploaded successfully",
      data: { url: res.data.fileUrl, fileKey: res.data.fileKey },
    };
  } catch (error) {
    console.error("Android screen upload error:", error);
    return {
      ok: false,
      message: "Failed to process screen upload",
      data: null,
    };
  }
}
