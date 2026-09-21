import "server-only";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3 } from "..";

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
 */
export async function presignPutObject(
  key: string,
  contentType: string,
  contentLength?: number,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env._AWS_UPLOAD_BUCKET!,
    Key: key,
    ContentType: contentType,
    ...(contentLength !== undefined && { ContentLength: contentLength }),
  });

  return getSignedUrl(s3, command, {
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
    ...(contentLength !== undefined && {
      signableHeaders: new Set(["content-length", "content-type"]),
    }),
  });
}
