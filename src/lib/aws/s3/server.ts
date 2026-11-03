"use server";

import { ActionPayload } from "@/lib/actions/types";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { presignPutObject } from "./presign";
import {
  UPLOAD_PURPOSE_CONFIG,
  buildUploadKey,
  uploadUrlRequestSchema,
  type UploadUrlRequest,
} from "./upload-purpose";
import { isAdmin } from "@/lib/auth/roles";

// Only these two live here now. The raw list/copy/delete/sign primitives moved
// to `server-internal.ts` (server-only) because every export of a
// `"use server"` module is a public endpoint.

/**
 * Resolves the owning user id for an upload request.
 *
 * `Capture.userId` is the worker who recorded a video; `Trace.userId` is the
 * annotator who processed it. They are distinct people, so each purpose has
 * exactly one authoritative owner — there is no fallback between them.
 *
 * @returns the owner's user id, or `null` when the record does not exist.
 */
async function resolveOwnerId(
  request: UploadUrlRequest,
): Promise<string | null> {
  if (UPLOAD_PURPOSE_CONFIG[request.purpose].owner === "capture") {
    const capture = await prisma.capture.findUnique({
      where: { id: request.resourceId },
      select: { userId: true },
    });
    return capture?.userId ?? null;
  }

  const trace = await prisma.trace.findUnique({
    where: { id: request.resourceId },
    select: { userId: true },
  });
  return trace?.userId ?? null;
}

/**
 * Issues a presigned upload URL for the signed-in owner of a capture or trace.
 *
 * Replaces the former `generatePresignedUploadURL`, which accepted an arbitrary
 * prefix from the browser with no authentication — any caller could obtain a
 * write URL for any key in the bucket. Here the client supplies only a purpose,
 * a resource id and a file name; the key is built server-side, the session is
 * required, ownership is checked, and the declared size is bound into the
 * signature so S3 rejects a mismatched upload.
 *
 * This gates writes only. Public read access to `traces/` via unsigned
 * CloudFront URLs is unchanged — see `listFromS3` in `server-internal.ts`.
 *
 * `traces/` is public and a trace's `userId` is the worker who recorded the
 * capture (not the person who approved it), so the trace purposes are ADMIN
 * only: a worker must not be able to overwrite the public screens of their own
 * approved trace.
 */
export async function createUploadUrl(input: unknown): Promise<
  ActionPayload<{
    uploadUrl: string;
    fileKey: string;
    fileName: string;
  }>
> {
  const parsed = uploadUrlRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid upload request.",
      data: null,
    };
  }
  const request = parsed.data;

  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Unauthorized", data: null };
  }

  if (
    UPLOAD_PURPOSE_CONFIG[request.purpose].owner === "trace" &&
    !isAdmin(session)
  ) {
    return { ok: false, message: "Not found.", data: null };
  }

  const ownerId = await resolveOwnerId(request);
  // A missing record and a foreign record are reported identically, so this
  // cannot be used to probe which ids exist.
  if (!ownerId || (ownerId !== session.user.id && !isAdmin(session))) {
    return { ok: false, message: "Not found.", data: null };
  }

  const fileKey = buildUploadKey(request);

  try {
    // Browser uploads are the ones that may come from a distant network, so
    // this is the only caller that opts into acceleration.
    const uploadUrl = await presignPutObject(
      fileKey,
      request.contentType,
      request.size,
      true,
    );
    return {
      ok: true,
      message: "Pre-signed upload URL generated.",
      data: { uploadUrl, fileKey, fileName: request.fileName },
    };
  } catch (err) {
    // Never surface S3 or signing detail to the caller.
    console.error("Error generating presigned URL", err);
    return {
      ok: false,
      message: "Failed to generate presigned URL",
      data: null,
    };
  }
}
