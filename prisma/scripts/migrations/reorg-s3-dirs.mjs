/**
 * One-time migration: move S3 screen files from uploads/<captureId>/screens/
 * to traces/<traceId>/ and update MongoDB Screen.src / Screen.vh URLs.
 *
 * This script has already been run. It is kept as a reference.
 *
 * Required env vars (loaded from .env.local):
 *   _AWS_ACCESS_KEY_ID, _AWS_SECRET_ACCESS_KEY, _AWS_REGION,
 *   _AWS_UPLOAD_BUCKET, CLOUDFRONT_URL
 *
 * Usage:
 *   node prisma/scripts/migrations/reorg-s3-dirs.mjs
 */

import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

import { CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const required = ["_AWS_ACCESS_KEY_ID", "_AWS_SECRET_ACCESS_KEY", "_AWS_REGION", "_AWS_UPLOAD_BUCKET", "CLOUDFRONT_URL"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const AWS_REGION     = process.env._AWS_REGION;
const AWS_S3_BUCKET  = process.env._AWS_UPLOAD_BUCKET;
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env._AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env._AWS_SECRET_ACCESS_KEY,
  },
});

async function main() {
  let endS3Retrieval = false;
  let continuationToken = "";
  const captureIds = [];

  while (!endS3Retrieval) {
    const command = new ListObjectsV2Command({
      Bucket: AWS_S3_BUCKET,
      Prefix: "uploads/",
    });
    if (continuationToken) {
      command.input.ContinuationToken = continuationToken;
    }
    const response = await s3.send(command);
    continuationToken = response.NextContinuationToken;
    const filteredCaptureIds = [...new Set(response.Contents.filter((file) => {
      return file.Key.includes("screens/");
    }).map((file) => {
      return file.Key.split("/")[1];
    }))];

    captureIds.push(...filteredCaptureIds);
    if (!response.NextContinuationToken) {
      endS3Retrieval = true;
    }
  }

  for (const [i, c] of captureIds.entries()) {
    console.log(`processing capture ${i + 1} of ${captureIds.length}`);
    const screens = await prisma.screen.findMany({
      where: { src: { contains: c } },
      select: { id: true, traceId: true, src: true, vh: true },
    });

    for (const s of screens) {
      const traceId = s.traceId;
      const screenSrcFilePath = s.src.replace(CLOUDFRONT_URL, "");
      const newFileKey = screenSrcFilePath.replace(`uploads/${c}`, `traces/${traceId}`);

      const copyCommand = new CopyObjectCommand({
        Bucket: AWS_S3_BUCKET,
        CopySource: `${AWS_S3_BUCKET}/${screenSrcFilePath}`,
        Key: newFileKey,
      });
      const copyRes = await s3.send(copyCommand);
      console.log("copy", copyRes.$metadata.httpStatusCode);

      const deleteCommand = new DeleteObjectCommand({ Bucket: AWS_S3_BUCKET, Key: screenSrcFilePath });
      const deleteRes = await s3.send(deleteCommand);
      console.log("delete", deleteRes.$metadata.httpStatusCode);

      if (s.vh) {
        const screenVHFilePath = s.vh.replace(CLOUDFRONT_URL, "");
        const newVHKey = screenVHFilePath.replace(`uploads/${c}`, `traces/${traceId}`);
        const copyVH = new CopyObjectCommand({
          Bucket: AWS_S3_BUCKET,
          CopySource: `${AWS_S3_BUCKET}/${screenVHFilePath}`,
          Key: newVHKey,
        });
        await s3.send(copyVH);
        const deleteVH = new DeleteObjectCommand({ Bucket: AWS_S3_BUCKET, Key: screenVHFilePath });
        await s3.send(deleteVH);
      }

      const updateFields = {};
      if (s.src) updateFields.src = s.src.replace(`uploads/${c}`, `traces/${traceId}`);
      if (s.vh)  updateFields.vh  = s.vh.replace(`uploads/${c}`, `traces/${traceId}`);

      await prisma.screen.update({ where: { id: s.id }, data: updateFields });
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
