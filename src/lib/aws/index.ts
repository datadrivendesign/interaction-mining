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

export const lambda = new LambdaClient({
  region: process.env._AWS_REGION!,
  credentials: {
    accessKeyId: process.env._AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env._AWS_SECRET_ACCESS_KEY!,
  },
});
