import React from "react";
import {
  ArrowDownFromLine,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  ArrowUpFromLine,
  Circle,
  CircleDot,
  CircleHelp,
  CircleStop,
  Grab,
  IterationCcw,
  IterationCw,
  Keyboard,
  Move,
  RefreshCw,
  ScanSearch,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { z } from "zod";

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

export const gestureOptions: GestureOption[] = [
  {
    value: "tap",
    label: "Tap",
    icon: <Circle className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />,
  },
  {
    value: "swipe",
    label: "Finger swipe",
    icon: <Move className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />,
    subGestures: [
      {
        value: "swipe up",
        label: "Swipe up",
        icon: (
          <ArrowUpFromLine 
            className="w-[70%] h-[70%] text-yellow-800 hover:text-black"
          />
        ),
      },
      {
        value: "swipe down",
        label: "Swipe down",
        icon: (
          <ArrowDownFromLine 
            className="w-[70%] h-[70%] text-yellow-800 hover:text-black"
          />
        ),
      },
      {
        value: "swipe left",
        label: "Swipe left",
        icon: (
          <ArrowLeftFromLine 
            className="w-[70%] h-[70%] text-yellow-800 hover:text-black"
          />
        ),
      },
      {
        value: "swipe right",
        label: "Swipe right",
        icon: (
          <ArrowRightFromLine 
            className="w-[70%] h-[70%] text-yellow-800 hover:text-black"
          />
        ),
      },
    ],
  },
  {
    value: "typing",
    label: "Typing",
    icon: <Keyboard className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />,
  },
  {
    value: "touch and hold",
    label: "Touch and hold",
    icon: <CircleDot className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />,
  },
  {
    value: "double tap",
    label: "Double tap",
    icon: <CircleStop className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />,
  },
  {
    value: "drag",
    label: "Drag",
    icon: <Grab className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />,
  },
  {
    value: "zoom",
    label: "Zoom",
    icon: <ScanSearch className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />,
    subGestures: [
      {
        value: "zoom in",
        label: "Zoom in",
        icon: <ZoomIn className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />,
      },
      {
        value: "zoom out",
        label: "Zoom out",
        icon: <ZoomOut className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />,
      },
    ],
  },
  {
    value: "rotate",
    label: "Rotate",
    icon: <RefreshCw className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />,
    subGestures: [
      {
        value: "rotate cw",
        label: "Rotate clockwise",
        icon: (
          <IterationCw className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "rotate ccw",
        label: "Rotate counter-clockwise",
        icon: (
          <IterationCcw className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />
        ),
      },
    ],
  },
  {
    value: "other",
    label: "Other",
    icon: <CircleHelp className="w-[70%] h-[70%] text-yellow-800 hover:text-black" />,
  },
]; 