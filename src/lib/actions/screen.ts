import { prisma } from "@/lib/prisma";
import { Screen } from "@prisma/client";
import { isObjectIdOrHexString } from "mongoose";

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
