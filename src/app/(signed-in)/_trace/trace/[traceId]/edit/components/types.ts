import { Screen, ScreenGesture } from "@prisma/client";
import { z, ZodType } from "zod";
export interface Redaction {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  annotation: string;
}

export type TraceFormData = {
  screens: Screen[];
  vhs?: { [key: string]: any };
  gestures: { [key: string]: ScreenGesture };
  redactions: { [key: string]: Redaction[] };
  description: string;
};

export const ScreenSchema = z
  .array(
    z.object({
      id: z.string(),
      v: z.number().nullable(),
      created: z.date(),
      src: z.string(),
      gesture: z.object({
        type: z.string().or(z.null()),
        x: z.number().nullable(),
        y: z.number().nullable(),
        scrollDeltaX: z.number().nullable(),
        scrollDeltaY: z.number().nullable(),
        description: z.string().nullable(),
      }),
      redactions: z
        .array(
          z.object({
            x: z.number(),
            y: z.number(),
            width: z.number(),
            height: z.number(),
            annotation: z.string(),
          })
        ),
      vh: z.string(),
      traceId: z.string(),
    })
  )
  .min(1, { message: "At least one screen is required" });

export const GestureSchema = z.record(
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
    scrollDeltaX: z.number() || z.null(),
    scrollDeltaY: z.number() || z.null(),
    description: z.string({
      message: "Description is required",
    }),
  })
);

export const GestureOptionSchema: z.ZodType<{
  value: string;
  label: string;
  icon?: React.JSX.Element;
  subGestures?: any;
}> = z.lazy(
  (): z.ZodType<any> => // 👈 annotate the return type here
    z.object({
      value: z.string(),
      label: z.string(),
      icon: z.custom<React.JSX.Element>().optional(),
      subGestures: z.array(GestureOptionSchema).optional(),
    })
);

// Then define the type from schema (for safety & completion support)
export type GestureOption = z.infer<typeof GestureOptionSchema>;

export const ScreenGestureSchema = z
  .object({
    screens: ScreenSchema,
    gestures: GestureSchema,
  })
  .refine(
    (data) => {
      return data.screens.every((screen) => data.gestures[screen.id]);
    },
    { message: "Each screen must have a gesture" }
  );

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
      })
    )
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
    { message: "Each redaction must have an annotation." }
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
  })
  .refine(
    (data) => {
      // Validate that each screen has a gesture
      for (let screen of data.screens) {
        if (!data.gestures[screen.id]) {
          return false;
        }
      }

      return true;
    },
    { message: "Each screen must have a gesture" }
  );
