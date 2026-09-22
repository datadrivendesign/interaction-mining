import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3 } from "..";

/**
 * Whether presigned browser uploads should target S3 Transfer Acceleration.
 *
 * Read per call, matching how every other variable in this file is read.
 *
 * The `_AWS_` prefix is load-bearing, not decorative: `amplify.yml` copies only
 * variables matching a fixed set of patterns into `.env.production` at build
 * time, and `_AWS` is one of them. A name outside those patterns never reaches
 * the deployed runtime at all, which is silent — the flag simply reads as
 * undefined and acceleration stays off. Renaming this must keep the prefix, or
 * add a matching line to the build spec.
 *
 * Off by default, so standard signing is the instant rollback: flipping the
 * variable reverts every new upload without a deploy. Never enabled against
 * MinIO, whose path-style custom endpoint is incompatible with the
 * virtual-hosted accelerate endpoint.
 */
function uploadAccelerationEnabled(): boolean {
  return (
    process.env._AWS_UPLOAD_ACCELERATE === "true" &&
    process.env.USE_MINIO_STORE !== "true"
  );
}

/**
 * Signing client for the accelerate endpoint, used only for browser uploads
 * from distant networks. Server-side writes stay on the standard client: they
 * run in-region, where acceleration adds cost and no benefit.
 */
const s3Accelerated = new S3Client({
  region: process.env._AWS_REGION!,
  useAccelerateEndpoint: true,
  credentials: {
    accessKeyId: process.env._AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env._AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * How long a presigned upload URL stays valid. S3 evaluates expiry when the
 * request *arrives*, not when it completes, so a long upload that starts in
 * time is unaffected — only a retry needs a fresh URL.
 */
export const UPLOAD_URL_EXPIRY_SECONDS = 3600;

/**
 * Signs a PUT for one S3 object key.
 *
 * Server-only on purpose: this is the low-level primitive with no authorization
 * of its own, so it must never be reachable from the browser. Callers that can
 * be invoked by a client go through `createUploadUrl` in `./server`, which
 * authenticates, validates and constructs the key itself.
 *
 * @param key Fully-formed S3 object key. Callers own its construction.
 * @param contentType MIME type the uploader must send.
 * @param contentLength When provided, the byte length **and the content type**
 *   are folded into the SigV4 signature, so S3 rejects an upload that differs
 *   in either with `SignatureDoesNotMatch`. Binding the type matters because
 *   the SDK does not sign it by default: without this, a caller could declare
 *   `image/png` to pass validation and then PUT `text/html`, and S3 would
 *   store and later serve it as HTML. Omit the argument to leave both
 *   unconstrained — the server-side Android path does, because it is trusted,
 *   writes only under `uploads/` (never publicly served), and its runtime does
 *   not set these headers as predictably as a browser.
 * @param accelerate Sign against the S3 Transfer Acceleration endpoint. Only
 *   browser uploads pass this: server-side callers already run in-region, where
 *   acceleration is pure cost. Ignored unless `_AWS_UPLOAD_ACCELERATE` is on, and
 *   never applied to MinIO.
 */
export async function presignPutObject(
  key: string,
  contentType: string,
  contentLength?: number,
  accelerate = false,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env._AWS_UPLOAD_BUCKET!,
    Key: key,
    ContentType: contentType,
    ...(contentLength !== undefined && { ContentLength: contentLength }),
  });

  const client = accelerate && uploadAccelerationEnabled() ? s3Accelerated : s3;

  return getSignedUrl(client, command, {
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
    ...(contentLength !== undefined && {
      signableHeaders: new Set(["content-length", "content-type"]),
    }),
  });
}
