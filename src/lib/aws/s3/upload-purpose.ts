import { z } from "zod";

/**
 * Upload purposes. Each one fixes the key namespace, the owning record, the
 * accepted MIME types and a size ceiling, so the browser never supplies a
 * prefix and cannot write outside its own capture or trace.
 */
export const UploadPurpose = {
  CAPTURE_VIDEO: "capture-video",
  CAPTURE_DRAFT: "capture-draft",
  TRACE_SCREEN: "trace-screen",
  TRACE_VH: "trace-vh",
} as const;

export type UploadPurpose = (typeof UploadPurpose)[keyof typeof UploadPurpose];

/**
 * Which record holds the authoritative owner for a purpose.
 *
 * These are two different people by design, not two sources for one fact:
 * `Capture.userId` is the worker who recorded the video, `Trace.userId` is the
 * annotator who processed it. They routinely differ, so resolving one from the
 * other — or denying when they disagree — would reject legitimate uploads.
 */
export type OwnerRecord = "capture" | "trace";

type PurposeConfig = {
  owner: OwnerRecord;
  /** Builds the key prefix from the validated resource id. */
  prefix: (resourceId: string) => string;
  contentTypes: readonly string[];
  extensions: readonly string[];
  maxBytes: number;
};

const MB = 1024 * 1024;

export const UPLOAD_PURPOSE_CONFIG: Record<UploadPurpose, PurposeConfig> = {
  [UploadPurpose.CAPTURE_VIDEO]: {
    owner: "capture",
    prefix: (id) => `uploads/${id}`,
    contentTypes: ["video/mp4", "video/quicktime"],
    extensions: [".mp4", ".mov"],
    // leaves 2gb of headroom while staying bounded.
    maxBytes: 2048 * MB,
  },
  [UploadPurpose.CAPTURE_DRAFT]: {
    owner: "capture",
    prefix: (id) => `uploads/${id}/drafts`,
    contentTypes: ["application/json"],
    extensions: [".json"],
    maxBytes: 64 * MB,
  },
  [UploadPurpose.TRACE_SCREEN]: {
    owner: "trace",
    prefix: (id) => `traces/${id}/screens`,
    contentTypes: ["image/png"],
    extensions: [".png"],
    maxBytes: 32 * MB,
  },
  [UploadPurpose.TRACE_VH]: {
    owner: "trace",
    prefix: (id) => `traces/${id}/vhs`,
    contentTypes: ["application/json"],
    extensions: [".json"],
    maxBytes: 32 * MB,
  },
};

/** MongoDB ObjectId, validated before it ever reaches Prisma. */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid resource id.");

/**
 * A single path segment safe to append to a server-built prefix: no separators,
 * no traversal, no control characters, no leading dot.
 *
 * Deliberately a safety check, not a format check. Real keys in this bucket
 * include segments like `2026-02-21 16:21:44.690_TYPE_VIEW_CLICKED`, so spaces
 * and colons are legitimate; an allowlist of "tidy" characters would reject
 * production traffic.
 */
export const safePathSegmentSchema = z
  .string()
  .min(1)
  .max(200)
  // Messages stay field-agnostic: this schema validates `fileName` on upload
  // requests and `id` on Android frame uploads, so they are prefixed with the
  // failing field's path by the caller rather than naming one here.
  .refine((v) => !v.includes("/") && !v.includes("\\"), {
    message: "Must not contain path separators.",
  })
  .refine((v) => !v.includes(".."), {
    message: "Must not contain '..'.",
  })
  .refine((v) => !/[\u0000-\u001f\u007f]/.test(v), {
    message: "Must not contain control characters.",
  })
  .refine((v) => !v.startsWith("."), {
    message: "Must not start with a dot.",
  });

/**
 * A draft version: the draft file's name without `.json`, e.g.
 * `draft-1761234567890`. Drafts are named `draft-<Date.now()>.json`, and the
 * newest timestamp wins everywhere drafts are read.
 */
export const draftVersionSchema = z
  .string()
  .regex(/^draft-\d{1,16}$/, "Invalid draft version.");

/** `uploads/<id>/drafts/draft-123.json` → `draft-123`, else null. */
export function draftVersionFromKey(key: string): string | null {
  const match = key.match(/(?:^|\/)(draft-\d{1,16})\.json$/);
  return match ? match[1] : null;
}

/** Numeric timestamp of a draft version, for newest-wins comparisons. */
export function draftVersionTime(version: string): number {
  return Number(version.slice("draft-".length));
}

/** The newer of two draft versions (either may be missing). */
export function newerDraftVersion(
  a: string | null,
  b: string | null,
): string | null {
  if (!a) return b;
  if (!b) return a;
  return draftVersionTime(b) > draftVersionTime(a) ? b : a;
}

/**
 * The version for the next save: the server's clock, but always after the
 * current newest, so a draft saved under a fast clock is never overtaken by
 * one saved later.
 */
export function nextDraftVersion(current: string | null, now: number): string {
  const after = current ? draftVersionTime(current) + 1 : 0;
  return `draft-${Math.max(now, after)}`;
}

export const uploadUrlRequestSchema = z
  .object({
    purpose: z.nativeEnum(UploadPurpose),
    resourceId: objectIdSchema,
    fileName: safePathSegmentSchema,
    contentType: z.string().min(1).max(255),
    size: z.number().int().positive(),
  })
  .superRefine((value, ctx) => {
    const config = UPLOAD_PURPOSE_CONFIG[value.purpose];

    if (!config.contentTypes.includes(value.contentType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contentType"],
        message: `Unsupported file type for ${value.purpose}.`,
      });
    }

    const lower = value.fileName.toLowerCase();
    if (!config.extensions.some((ext) => lower.endsWith(ext))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileName"],
        message: `Unsupported file extension for ${value.purpose}.`,
      });
    }

    if (value.size > config.maxBytes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["size"],
        message: `File exceeds the ${Math.round(config.maxBytes / MB)} MB limit for ${value.purpose}.`,
      });
    }
  });

export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;

/** Builds the object key server-side from validated input. */
export function buildUploadKey(request: UploadUrlRequest): string {
  return `${UPLOAD_PURPOSE_CONFIG[request.purpose].prefix(request.resourceId)}/${request.fileName}`;
}
