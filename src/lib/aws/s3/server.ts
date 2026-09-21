"use server";

import {
  ListObjectsV2Command,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getSignedCloudfrontUrl } from "@aws-sdk/cloudfront-signer";
import { Role } from "@prisma/client";
import { s3 } from "..";
import { ActionPayload } from "@/lib/actions/types";
import { ListedFiles } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { presignPutObject } from "./presign";
import {
  UPLOAD_PURPOSE_CONFIG,
  buildUploadKey,
  uploadUrlRequestSchema,
  type UploadUrlRequest,
} from "./upload-purpose";

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
 * CloudFront URLs is unchanged — see `listFromS3`.
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

  const ownerId = await resolveOwnerId(request);
  // A missing record and a foreign record are reported identically, so this
  // cannot be used to probe which ids exist.
  if (
    !ownerId ||
    (ownerId !== session.user.id && session.user.role !== Role.ADMIN)
  ) {
    return { ok: false, message: "Not found.", data: null };
  }

  const fileKey = buildUploadKey(request);

  try {
    const uploadUrl = await presignPutObject(
      fileKey,
      request.contentType,
      request.size,
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

/*
 * Fetches a list of files from S3.
 * @param key The S3 object key to fetch.
 * @returns
 */
export async function listFromS3(
  key: string,
  generateSignedUrl: boolean = true, // don't generate signed if not needed
): Promise<ActionPayload<ListedFiles[]>> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env._AWS_UPLOAD_BUCKET!,
      Prefix: key,
    });
    const files = await s3.send(command);

    if (!files.Contents || files.Contents.length === 0) {
      return {
        ok: true,
        message: "File not found",
        data: [],
      };
    }

    const filePayload = await Promise.all(
      files.Contents.map(async (file: any) => {
        // use signed cloudfront url to grab file url
        let fileUrl = "";
        if (process.env.USE_MINIO_STORE === "true") {
          fileUrl = `${process.env.MINIO_ENDPOINT}/${process.env._AWS_UPLOAD_BUCKET}/${file.Key}`;
        } else {
          const cloudfrontUrl = `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${file.Key}`;
          if (file.Key.includes("traces/") || !generateSignedUrl) {
            // traces are available publicly
            fileUrl = cloudfrontUrl;
          } else if (generateSignedUrl) {
            const signedUrlRes = await generateSignedCloudFrontURL(file.Key);
            if (signedUrlRes.ok) {
              fileUrl = signedUrlRes.data.signedUrl;
            }
          }
        }
        return {
          fileKey: file.Key,
          fileName: file.Key.split("/").pop() || "",
          fileUrl: fileUrl,
        };
      }),
    );

    if (filePayload.some((file) => file.fileUrl === "")) {
      return {
        ok: false,
        message: "Failed to retrieve file URL for some files",
        data: null,
      };
    }

    return {
      ok: true,
      message: "File(s) found",
      data: filePayload,
    };
  } catch (err) {
    console.error("Error fetching file from S3:", err);
    return {
      ok: false,
      message: "Failed to fetch file",
      data: null,
    };
  }
}

export async function copyFromS3(fileKey: string, destPath: string) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env._AWS_UPLOAD_BUCKET!,
      Prefix: fileKey,
    });
    const response = await s3.send(command);
    if (!response.Contents || response.Contents.length === 0) {
      return { ok: false, message: "File not found.", data: null };
    }
    const copyCommand = new CopyObjectCommand({
      Bucket: process.env._AWS_UPLOAD_BUCKET!,
      CopySource: `${process.env._AWS_UPLOAD_BUCKET!}/${fileKey}`,
      Key: destPath,
      MetadataDirective: "COPY",
    });
    let res = await s3.send(copyCommand);

    if (res.$metadata.httpStatusCode !== 200) {
      return { ok: false, message: "Failed to copy file.", data: null };
    }

    return { ok: true, message: "File copied.", data: null };
  } catch (err) {
    console.error("Error deleting file:", err);
    return { ok: false, message: "Failed to copy file.", data: null };
  }
}

/**
 * Deletes an uploaded file from S3.
 * @param fileKey The S3 object key of the file to delete.
 * @returns ActionPayload
 */
export async function deleteFromS3(fileKey: string) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env._AWS_UPLOAD_BUCKET!,
      Prefix: fileKey,
    });

    const response = await s3.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return { ok: false, message: "File not found.", data: null };
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env._AWS_UPLOAD_BUCKET!,
      Key: fileKey,
    });

    let res = await s3.send(deleteCommand);

    if (res.$metadata.httpStatusCode !== 204) {
      return { ok: false, message: "Failed to delete file.", data: null };
    }

    return { ok: true, message: "File deleted.", data: null };
  } catch (err) {
    console.error("Error deleting file:", err);
    return { ok: false, message: "Failed to delete file.", data: null };
  }
}

/**
 * A server version of uploadToS3. This is needed because Android
 * upload API route is running on a server component.
 * @param file Android screen JSON data formed into a File
 * @param prefix S3 bucket prefix
 * @param key S3 bucket key
 * @param contentType MIME type of uploaded content (should be JSON normally)
 * @returns
 */
export async function uploadAndroidAPIDataToS3(
  file: File,
  prefix: string,
  key: string,
  contentType: string,
): Promise<ActionPayload<any>> {
  // Trusted server-side caller: it goes straight to the internal presigner
  // rather than through `createUploadUrl`, because the Android API has no
  // browser session to authenticate against. Its inputs are validated at the
  // route boundary instead. Size is deliberately left unbound here so this
  // path's behaviour is unchanged.
  const fileKey = `${prefix}/${key}`;
  let uploadUrl: string;
  try {
    uploadUrl = await presignPutObject(fileKey, contentType);
  } catch (err) {
    console.error("Error generating presigned URL", err);
    return {
      ok: false,
      message: "Failed to generate presigned URL",
      data: null,
    };
  }

  const uploadData = {
    uploadUrl,
    fileKey,
    fileName: key,
    filePrefix: prefix,
  };

  const res = await fetch(uploadData.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": contentType },
  });

  if (!res.ok) {
    console.error("S3 upload failed", await res.text());
    return {
      ok: false,
      message: "Failed to upload file",
      data: null,
    };
  }

  return {
    ok: true,
    message: "File uploaded successfully",
    data: uploadData,
  };
}

export async function generateSignedCloudFrontURL(
  fileKey: string,
  expiryHours: number = 2,
): Promise<ActionPayload<{ signedUrl: string }>> {
  const session = await auth();
  if (!session || !session.user) {
    return {
      ok: false,
      message: "Unauthorized",
      data: null,
    };
  }
  try {
    const cloudfrontUrl = `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${fileKey}`;

    const privateKey = Buffer.from(
      process.env._AWS_CLOUDFRONT_PRIVATE_KEY!,
      "base64",
    ).toString("utf-8");
    const signedUrl = getSignedCloudfrontUrl({
      url: cloudfrontUrl,
      dateLessThan: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
      keyPairId: process.env._AWS_CLOUDFRONT_KEY_PAIR_ID!,
      privateKey: privateKey,
    });

    return {
      ok: true,
      message: "Signed URL generated",
      data: { signedUrl },
    };
  } catch (error) {
    return {
      ok: false,
      message: "Failed to generate signed URL",
      data: null,
    };
  }
}
