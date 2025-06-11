import { ScreenGesture } from "@prisma/client";
import { z, ZodType } from "zod";

export type FrameData = {
  id: string;
  src: string;
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
};

export const ScreenSchema = z
  .array(
    z.object({
      id: z.string(),
      src: z.string(),
      timestamp: z.number(),
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
      message: "Gesture description is required",
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
      // Check all screens except the last one have gestures
      return data.screens.slice(0, -1).every((screen) => {
        return data.gestures[screen.id];;
      });
    },
    { message: "Each screen except the last one must have a gesture" }
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
      for (let screen of data.screens.slice(0, -1)) {
        if (!data.gestures[screen.id]) {
          return false;
        }
      }
      return true;
    },
    { message: "Each screen except the last one must have a gesture" }
  );
