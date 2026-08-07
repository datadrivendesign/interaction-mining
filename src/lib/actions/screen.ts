"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, Screen, ScreenGesture } from "@prisma/client";
import { isObjectIdOrHexString } from "mongoose";
import { ActionPayload } from "./types";
import { S3Client } from "@aws-sdk/client-s3";
import { uploadAndroidAPIDataToS3 } from "../aws";
import {
  DraftFrameData,
  DraftTraceFormData,
  Redaction,
} from "@/app/(signed-in)/capture/[captureId]/edit/components/types";
import { createScreenGesture } from "@/app/(signed-in)/capture/[captureId]/edit/components/repair-screen/util/android-gesture-translate";

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
  data: Partial<Screen>,
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
 * Handles the upload of an Android screen and its view hierarchy.
 * @param data The data containing screen information.
 * @returns ActionPayload with uploaded file information or error message.
 */
export async function handleAndroidScreenUpload(data: {
  vh: string;
  img: string;
  created: string;
  id: string;
  captureId: string;
}): Promise<ActionPayload<{ url: string; fileKey: string }>> {
  try {
    // create s3 json
    const file = new File([JSON.stringify(data)], `${data.id}.json`, {
      type: "application/json",
    });
    const [res] = await Promise.all([
      uploadAndroidAPIDataToS3(
        file,
        `uploads/${data.captureId}`,
        `${data.id}.json`,
        "application/json",
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

/**
 * Handles the upload of an Android trace metadata of redaction and gestures
 * @param data The data containing trace metadata information.
 * @returns ActionPayload with uploaded file information or error message.
 */
export async function handleAndroidMetadataUpload(data: {
  screens: {
    id: string;
    timestamp: string;
  }[];
  gestures: {
    [key: string]: {
      type: string;
      scrollDeltaX: number;
      scrollDeltaY: number;
      x: number;
      y: number;
    };
  };
  redactions: {
    [key: string]: {
      x: number;
      y: number;
      endX: number;
      endY: number;
      label: string;
    }[];
  };
  captureId: string;
}): Promise<ActionPayload<{ url: string; fileKey: string }>> {
  try {
    const draftScreensMetadata: DraftFrameData[] = data.screens.map(
      (screen) => ({
        id: screen.id,
        timestamp: Date.parse(screen.timestamp),
      }),
    );
    const draftGesturesMetadata: { [key: string]: ScreenGesture } = {};
    const draftRedactionsMetadata: { [key: string]: Redaction[] } = {};
    for (const screen of data.screens) {
      // translate gesture from android to mongo format
      const translatedGesture = createScreenGesture(data.gestures[screen.id]);
      draftGesturesMetadata[screen.id] = translatedGesture;
      // translate redactions from android to mongo format
      const androidRedactions = data.redactions[screen.id];
      const translatedRedactions = androidRedactions.map((redaction, i) => ({
        id: `${Date.now()}-${i}`,
        x: redaction.x,
        y: redaction.y,
        width: redaction.endX - redaction.x,
        height: redaction.endY - redaction.y,
        annotation: redaction.label,
      }));
      draftRedactionsMetadata[screen.id] = translatedRedactions;
    }
    const draftTraceMetadata: DraftTraceFormData = {
      screens: draftScreensMetadata,
      gestures: draftGesturesMetadata,
      redactions: draftRedactionsMetadata,
      description: "",
    };

    // create s3 json
    const fileName = "original-metadata.json";
    const file = new File([JSON.stringify(draftTraceMetadata)], fileName, {
      type: "application/json",
    });
    const [res] = await Promise.all([
      uploadAndroidAPIDataToS3(
        file,
        `uploads/${data.captureId}`,
        fileName,
        "application/json",
      ),
    ]);

    if (!res.ok) {
      return {
        ok: false,
        message: "Failed to upload trace metadata",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Trace metadata file uploaded successfully",
      data: { url: res.data.fileUrl, fileKey: res.data.fileKey },
    };
  } catch (error) {
    console.error("Android trace metadata upload error:", error);
    return {
      ok: false,
      message: "Failed to process trace metadata upload",
      data: null,
    };
  }
}
