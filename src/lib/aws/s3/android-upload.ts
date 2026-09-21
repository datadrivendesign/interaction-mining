import { z } from "zod";

import { safePathSegmentSchema } from "./upload-purpose.ts";

/**
 * Request schemas for the Android capture upload API.
 *
 * Both mirror what the client actually sends, verified against
 * `UploadDataOps` in the odim-android repo rather than inferred from the
 * handlers' TypeScript types. Each object is `.passthrough()` so a field added
 * by a future client release is forwarded instead of silently dropped.
 */

const MAX_FIELD_BYTES = 32 * 1024 * 1024;

/**
 * `uploadScreenCapture` sends exactly `vh`, `img`, `created`, `id` — all
 * strings. `captureId` (from the route) and `id` are the only values that reach
 * an S3 object key, so they are the only ones constrained for safety.
 *
 * `id` is built as `"${screenCreatedAt}_${screenGestureType}"`, e.g.
 * `2026-02-21 16:21:44.690_TYPE_VIEW_CLICKED`. Spaces and colons are normal
 * here, so this has to be a path-safety check and not a character allowlist.
 */
export const androidFrameUploadSchema = z
  .object({
    vh: z.string().max(MAX_FIELD_BYTES),
    img: z.string().max(MAX_FIELD_BYTES),
    created: z.string().min(1).max(64),
    id: safePathSegmentSchema,
  })
  .passthrough();

const gestureSchema = z
  .object({
    type: z.string(),
    x: z.number(),
    y: z.number(),
    scrollDeltaX: z.number(),
    scrollDeltaY: z.number(),
  })
  .passthrough();

const redactionSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    endX: z.number(),
    endY: z.number(),
    label: z.string(),
  })
  .passthrough();

/**
 * `uploadCaptureMetadata` sends three top-level objects keyed by screen id.
 *
 * The inner shapes are validated so a malformed payload is a 400 rather than a
 * 500: `handleAndroidMetadataUpload` indexes `redactions[screen.id]` and calls
 * `.map()` on it, which would throw on a missing or non-array entry.
 *
 * The stored `original-metadata.json` also contains `description` fields; those
 * are added by the handler during translation, not sent by the client.
 */
export const androidMetadataUploadSchema = z
  .object({
    screens: z
      .array(
        z
          .object({ id: z.string().min(1).max(200), timestamp: z.string() })
          .passthrough(),
      )
      .max(5000),
    gestures: z.record(z.string(), gestureSchema),
    redactions: z.record(z.string(), z.array(redactionSchema)),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    // The handler dereferences both maps for every screen it iterates.
    for (const screen of value.screens) {
      if (!(screen.id in value.gestures)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gestures", screen.id],
          message: "Missing gesture for screen.",
        });
      }
      if (!(screen.id in value.redactions)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["redactions", screen.id],
          message: "Missing redactions for screen.",
        });
      }
    }
  });
