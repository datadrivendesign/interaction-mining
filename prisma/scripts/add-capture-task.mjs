// Do not commit this file with actual hardcoded values filled in. These are utility scripts to help with development.
/** 
 * run this script to add a capture task to the database for a specific app and user.
 * this is useful when you need to add a capture task to the database
 * */ 
// example usage: node prisma/scripts/add-capture-task.mjs
import { PrismaClient, CaptureStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const os = ""  // "ios" or "android"
  // list of descriptions to add for app task
  const descriptions = [
    "",
  ]
  const userId = "" // user id to assign capture task to
  const appId = "" // app id to assign capture task to

  for (const description of descriptions) {
    const app = await prisma.app.findFirst({
      where: { packageName: appId, os: os },
    });

    const task = await prisma.task.create({
      data: { appId, os, description },
    });

    const capture = await prisma.capture.create({
      data: {
        app: {
          connect: { id: app?.id },
        },
        task: {
          connect: { id: task.id },
        },
        user: {
          connect: { id: userId },
        },
        otp: "",
        src: "",
        status: CaptureStatus.CREATED,
      }
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        captures: {
          connect: { id: capture.id },
        },
      }
    });

    if (!user) {
      throw new Error("Failed to update user.")
    }
    console.log("Capture and task created.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());