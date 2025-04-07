"use server";

import { prisma } from "@/lib/prisma";
import { Screen } from "@prisma/client";
import { isObjectIdOrHexString } from "mongoose";
import { ActionPayload } from "./types";
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

/**
 * Generates a pre-signed URL for direct S3 upload.
 * @param captureId The ID of the capture to upload the file to.
 * @param fileType The MIME type of the file to upload.
 * @returns ActionPayload
 */
export async function generatePresignedScreenUpload(
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
    const fileKey = `uploads/${captureId}/screens/${Date.now()}.${fileType.split("/")[fileType.split("/").length - 1]}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_RECORDING_UPLOAD_BUCKET!,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return {
      ok: true,
      message: "Image uploaded to storage",
      data: {
        uploadUrl,
        filePrefix: `uploads/${captureId}/`,
        fileKey,
        fileUrl: `https://${process.env.AWS_RECORDING_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
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

export async function handleAndroidScreenUpload(
  data: {
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
  }
): Promise<ActionPayload<{ url: string }>> {
  try {
    // // Validate Base64 image
    // if (!/^data:image\/png;base64,/.test(data.img)) {
    //   return { 
    //     ok: false, 
    //     message: "Invalid image format. Expected PNG Base64", 
    //     data: null 
    //   };
    // }

    // // Use transaction to ensure data consistency
    // const result = await prisma.$transaction(async (tx) => {
    //   // Create initial screen record
    //   const newScreen = await tx.screen.create({
    //     data: {
    //       created: new Date(data.created),
    //       gesture: data.gesture,
    //       src: "",
    //       vh: "",
    //       traceId: ""
    //     }
    //   });

    



      // Upload files to S3
      const [res] = await Promise.all([
        // uploadToS3({
        //   content: data.img.replace(/^data:image\/png;base64,/, ''),
        //   fileName: `${data.captureId}/${data.created}/screen.png`,
        //   contentType: 'image/png'
        // }),
        uploadToS3({
          content: JSON.stringify(data),
          fileName: `uploads/${data.captureId}/${data.created}.json`,
          contentType: 'application/json'
        })
      ]);

      // Update screen with S3 URLs
    //   return tx.screen.update({
    //     where: { id: newScreen.id },
    //     data: { src, vh }
    //   });
    // });

    return { 
      ok: true, 
      message: "Screen uploaded successfully", 
      data: { url: res} 
    };

  } catch (error) {
    console.error("Android screen upload error:", error);
    return { 
      ok: false, 
      message: "Failed to process screen upload", 
      data: null 
    };
  }
}

/**
 * Uploads content to S3 and returns the public URL.
 * @param content The content to upload (string or Buffer).
 * @param fileName The name of the file to save in S3.
 * @param contentType The MIME type of the content.
 * @returns The public URL of the uploaded file.
 */

async function uploadToS3({ content, fileName, contentType }: {
  content: string;
  fileName: string;
  contentType: string;
}): Promise<string> {
  // const buffer = typeof content === 'string' 
  //   ? Buffer.from(content, 'base64')
  //   : content;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_RECORDING_UPLOAD_BUCKET!,
    Key: fileName,
    Body: content,
    ContentType: contentType,
  });

  await s3.send(command);
  return `https://${process.env.AWS_RECORDING_UPLOAD_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}
