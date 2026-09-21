import { S3Client } from "@aws-sdk/client-s3";
import { LambdaClient } from "@aws-sdk/client-lambda";

export * from "./s3/client";
export * from "./s3/server";

export const s3 = new S3Client({
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

/**
 * Whether presigned browser uploads should target S3 Transfer Acceleration.
 *
 * Off by default so standard signing is the instant rollback: flipping the
 * variable reverts every new upload without a deploy. Never enabled against
 * MinIO, whose path-style custom endpoint is incompatible with the
 * virtual-hosted accelerate endpoint.
 */
export const uploadAccelerationEnabled =
  process.env.UPLOAD_ACCELERATE === "true" &&
  process.env.USE_MINIO_STORE !== "true";

/**
 * Signing client for the accelerate endpoint, used only for browser uploads
 * from distant networks. Server-side writes stay on the standard client: they
 * run in-region, where acceleration adds cost and no benefit.
 */
export const s3Accelerated = new S3Client({
  region: process.env._AWS_REGION!,
  useAccelerateEndpoint: true,
  credentials: {
    accessKeyId: process.env._AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env._AWS_SECRET_ACCESS_KEY!,
  },
});

export const lambda = new LambdaClient({
  region: process.env._AWS_REGION!,
  credentials: {
    accessKeyId: process.env._AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env._AWS_SECRET_ACCESS_KEY!,
  },
});
