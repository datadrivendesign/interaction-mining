import { ScreenGesture } from "@prisma/client";
import { z, ZodType } from "zod";
import {
  MIN_SLOT_LENGTH,
  validateGestureDescription,
} from "./repair-screen/util/gesture-description-template";

export type FrameData = {
  id: string;
  src: string;
  timestamp: number;
};

// Draft frame data type with no src to lower overhead when storing remotely
export type DraftFrameData = {
  id: string;
  timestamp: number;
};

export interface Redaction {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  annotation: string;
}

export type TraceFormData = {
  screens: FrameData[];
  vhs?: { [key: string]: any };
  gestures: { [key: string]: ScreenGesture };
  redactions: { [key: string]: Redaction[] };
  description: string;
  iPhoneVersion?: string;
  iOSVersion?: string;
};

// Draft trace form data with no vhs for lower overhead when storing remotely
export type DraftTraceFormData = {
  screens: DraftFrameData[];
  gestures: { [key: string]: ScreenGesture };
  redactions: { [key: string]: Redaction[] };
  description: string;
  iPhoneVersion?: string;
  iOSVersion?: string;
};

export const ScreenSchema = z
  .array(
    z.object({
      id: z.string(),
      src: z.string(),
      timestamp: z.number(),
    }),
  )
  .min(1, { message: "At least one screen is required" });

export const GestureSchema = z
  .record(
    z.object({
      type: z.string({
        message: "Gesture type is required",
      }),
      x: z.number({
        message: "X coordinate is required",
      }),
      y: z.number({
        message: "Y coordinate is required",
      }),
      scrollDeltaX: z.number().nullable(),
      scrollDeltaY: z.number().nullable(),
      description: z.string().min(1, {
        message: "Gesture description is required",
      }),
    }),
  )
  .refine(
    (gestures) =>
      Object.values(gestures).every((gesture) =>
        validateGestureDescription(gesture),
      ),
    {
      message: `Gesture descriptions must match the required template and each template field must be longer than ${MIN_SLOT_LENGTH} characters.`,
    },
  );

// Screen-annotation completeness is not a schema. Layering `.refine` on top of
// field validation under-reports, because zod skips a refine once the schema
// beneath it fails, so a screen missing its marker hid every screen missing its
// gesture entirely. It lives in `getScreenAnnotationIssue`
// (repair-screen/util/gesture-description-template.ts), which both the
// filmstrip's error ring and the step gates in page.tsx call.

export const RedactionSchema = z
  .record(
    z.array(
      z.object({
        id: z.string(),
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
        annotation: z.string(),
      }),
    ),
  )
  .refine(
    (data) => {
      // Validate that each screen has description
      for (let screen of Object.keys(data)) {
        for (let redaction of data[screen]) {
          if (!redaction.annotation) {
            return false;
          }
        }
      }
      return true;
    },
    { message: "Each redaction must have an annotation." },
  );

export const TraceFormSchema: ZodType<TraceFormData> = z
  .object({
    screens: ScreenSchema,
    vhs: z.record(z.any()).optional(),
    gestures: GestureSchema,
    redactions: RedactionSchema,
    description: z.string().nonempty({
      message: "A description is required",
    }),
    iPhoneVersion: z.string().optional(),
    iOSVersion: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate that each screen has a gesture
      for (let screen of data.screens.slice(0, -1)) {
        if (!data.gestures[screen.id]) {
          return false;
        }
      }
      return true;
    },
    { message: "Each screen except the last one must have a gesture" },
  );

const optionalNumber = z.number().nullish();

/**
 * Shape of a saved draft file, checked by the server before it writes or
 * approves one. Loose on purpose: a draft may be unfinished, so this checks
 * types and sizes, not completeness. Unknown keys are kept, so a resave never
 * drops data an older tool wrote.
 */
export const DraftTraceSchema = z
  .object({
    screens: z
      .array(
        z
          .object({
            id: z.string().min(1).max(200),
            timestamp: z.number(),
          })
          .passthrough(),
      )
      .max(2000),
    gestures: z.record(
      z
        .object({
          type: z.string().max(100).nullish(),
          x: optionalNumber,
          y: optionalNumber,
          scrollDeltaX: optionalNumber,
          scrollDeltaY: optionalNumber,
          description: z.string().max(2000).nullish(),
        })
        .passthrough(),
    ),
    redactions: z.record(
      z
        .array(
          z
            .object({
              id: z.string().max(200),
              x: z.number(),
              y: z.number(),
              width: z.number(),
              height: z.number(),
              annotation: z.string().max(1000).nullish(),
            })
            .passthrough(),
        )
        .max(500),
    ),
    description: z.string().max(2000),
    iPhoneVersion: z.string().max(100).optional(),
    iOSVersion: z.string().max(100).optional(),
  })
  .passthrough();

/**
 * A draft as trace form data for the completeness checks: no images or VHs
 * (the checks do not read them), missing gesture fields as null.
 */
export function traceFromDraft(
  draft: z.infer<typeof DraftTraceSchema>,
): TraceFormData {
  return {
    screens: draft.screens.map((screen) => ({
      id: screen.id,
      src: "",
      timestamp: screen.timestamp,
    })),
    gestures: Object.fromEntries(
      Object.entries(draft.gestures).map(([id, gesture]) => [
        id,
        {
          type: gesture.type ?? null,
          x: gesture.x ?? null,
          y: gesture.y ?? null,
          scrollDeltaX: gesture.scrollDeltaX ?? null,
          scrollDeltaY: gesture.scrollDeltaY ?? null,
          description: gesture.description ?? null,
        },
      ]),
    ),
    redactions: Object.fromEntries(
      Object.entries(draft.redactions).map(([id, boxes]) => [
        id,
        boxes.map((box) => ({
          id: box.id,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          annotation: box.annotation ?? "",
        })),
      ]),
    ),
    description: draft.description,
    iPhoneVersion: draft.iPhoneVersion,
    iOSVersion: draft.iOSVersion,
  };
}
