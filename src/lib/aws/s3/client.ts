"use client";

import { ListedFiles } from "@/lib/actions";
import { createUploadUrl, generateSignedCloudFrontURL } from "./server";
import { ActionPayload } from "@/lib/actions/types";
import type { UploadPurpose } from "./upload-purpose";
import {
  putWithRetry,
  type TerminalKind,
  type UploadState,
} from "./put-with-retry";
import { reportUploadEvent } from "./upload-telemetry";

// Check if signed Cloudfront URL is expired with expiry url param
// Will return true if within 5 minutes of expiry
export function isCloudfrontUrlExpired(url: string): boolean {
  if (!url.includes("?") || !url.includes("Expires=")) {
    return false; // Not a signed URL or public URL
  }

  try {
    const urlParams = new URLSearchParams(url.split("?")[1]);
    const expires = urlParams.get("Expires");
    if (!expires) return false;
    // Consider expired if within 5 minutes of expiry
    const expiryTime = parseInt(expires) * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    return currentTime >= expiryTime - 5 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * An upload that S3 accepted.
 *
 * `previewUnavailable` marks the case where the object is stored but no URL
 * for reading it back could be produced. That is a presentation problem, not an upload
 * failure, and must never be reported as one — see `uploadToS3`.
 */
export type UploadResult = ListedFiles & { previewUnavailable: boolean };

/**
 * Resolves the URL for reading a stored object back, or `null` if one cannot
 * be made. Named for the `ListedFiles.fileUrl` field it populates: the object
 * may be a video, a PNG screen or a view-hierarchy JSON, so "playback" would
 * only describe one of the three.
 *
 * Trace assets are public, so their URL is plain string concatenation and
 * cannot fail. Everything under `uploads/` needs a signed CloudFront URL, and
 * that call can fail on its own — an expired session, a key misconfiguration,
 * a dropped packet — entirely independently of whether the bytes are stored.
 */
async function resolveFileUrl(fileKey: string): Promise<string | null> {
  if (process.env.USE_MINIO_STORE === "true") {
    return `${process.env.MINIO_ENDPOINT}/${process.env._AWS_UPLOAD_BUCKET}/${fileKey}`;
  }

  if (fileKey.startsWith("traces/")) {
    // traces are available publicly
    return `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${fileKey}`;
  }

  const signedUrlRes = await generateSignedCloudFrontURL(fileKey);
  return signedUrlRes.ok ? signedUrlRes.data.signedUrl : null;
}

/**
 * Uploads a file straight to S3 with a presigned URL, retrying what is worth
 * retrying and reporting progress.
 *
 * The caller names a purpose and the capture or trace the file belongs to; the
 * server builds the object key, so no prefix crosses the boundary. Content type
 * and size are read off the `File` rather than passed in, because both are
 * bound into the signature and any mismatch is rejected by S3.
 *
 * Previously a failure of that URL call returned `ok: false` for an
 * object S3 had already stored, so the worker was told "Upload failed" and
 * re-uploaded the same file over a slow link. That case now succeeds with
 * `previewUnavailable: true`.
 */
export async function uploadToS3(
  file: File,
  purpose: UploadPurpose,
  resourceId: string,
  fileName: string,
  options: {
    signal?: AbortSignal;
    onState?: (state: UploadState) => void;
  } = {},
): Promise<ActionPayload<UploadResult> & { kind?: TerminalKind }> {
  const startedAt = Date.now();
  reportUploadEvent("upload_started", { purpose, bytes: file.size });

  // The server derives the key deterministically from purpose + resourceId +
  // fileName, so it is identical on every attempt. Capturing it here avoids a
  // second signing round-trip after success, and it is what makes a repeated
  // PUT idempotent rather than a duplicate object.
  let fileKey = "";

  const result = await putWithRetry({
    file,
    signal: options.signal,
    onState: options.onState,
    getFreshUrl: async () => {
      try {
        const res = await createUploadUrl({
          purpose,
          resourceId,
          fileName,
          contentType: file.type,
          size: file.size,
        });
        if (!res.ok) return { ok: false, message: res.message };
        fileKey = res.data.fileKey;
        return { ok: true, url: res.data.uploadUrl, contentType: file.type };
      } catch {
        // A server action *rejects* when the network is unavailable rather
        // than returning a failure payload. Converting it here keeps it inside
        // the retry loop; letting it throw would unwind past every retry.
        return { ok: false, message: "Could not reach the server." };
      }
    },
  });

  if (!result.ok) {
    reportUploadEvent("upload_finished", {
      purpose,
      bytes: file.size,
      durationMs: Date.now() - startedAt,
      outcome: result.kind,
      stage: result.stage,
      pageHidden: result.pageWasHidden,
    });
    return {
      ok: false,
      message: result.message,
      data: null,
      kind: result.kind,
    };
  }

  // Past this point the object is in S3. Nothing below may re-send it or
  // report failure.
  const fileUrl = await resolveFileUrl(fileKey);
  const degraded = fileUrl === null;

  reportUploadEvent("upload_finished", {
    purpose,
    bytes: file.size,
    durationMs: Date.now() - startedAt,
    outcome: degraded ? "post_put_degraded" : "succeeded",
    stage: degraded ? "post-put" : "put",
    attempts: result.attempts,
    pageHidden: result.pageWasHidden,
  });

  return {
    ok: true,
    message: degraded
      ? "File uploaded. Preview is temporarily unavailable."
      : "File uploaded successfully",
    data: {
      fileKey,
      fileName,
      fileUrl: fileUrl ?? "",
      previewUnavailable: degraded,
    },
  };
}
