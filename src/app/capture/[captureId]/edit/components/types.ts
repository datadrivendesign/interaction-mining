import { z, ZodType } from "zod";
import { TraceFormData } from "../page";

export const ScreenSchema = z
  .array(
    z.object({
      id: z.string(),
      url: z.string(),
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
  })
);

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

export const RedactionSchema = z.record(
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
);

export const TraceFormSchema: ZodType<TraceFormData> = z
  .object({
    screens: ScreenSchema,
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

  export type GestureOption = {
    value: string;
    label: string;
    icon?: React.JSX.Element;
    subGestures?: GestureOption[];
  }