// src/lib/utils/gesture-options.tsx
"use client";

import React from "react";
import { z } from "zod";

import { Keyboard, CircleHelp } from "lucide-react";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tap01Icon,
  Move01Icon,
  SwipeLeft01Icon,
  SwipeRight01Icon,
  SwipeUp01Icon,
  SwipeDown01Icon,
  Drag02Icon,
  DragLeft01Icon,
  DragRight01Icon,
  Minimize01Icon,
  Maximize01Icon,
  RotateSquareIcon,
  RotateTopLeftIcon,
  RotateTopRightIcon,
} from "@hugeicons/core-free-icons";

import DoubleTapIcon from "@/components/ui/gesture-icons/double-tap-01.svg";
import TouchHoldIcon from "@/components/ui/gesture-icons/touch-and-hold.svg";
import DragUpIcon from "@/components/ui/gesture-icons/drag-up-01.svg";
import DragDownIcon from "@/components/ui/gesture-icons/drag-down-01.svg";

import { cn } from "@/lib/utils";

/**
 * Shared icon wrapper so every source (Hugeicons/Lucide/custom SVG)
 * renders at the same size and color.
 *
 * - size: 36x36 (w-9 h-9)
 * - color: currentColor, controlled by CSS var --gesture-accent
 */
export const IconBox = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center justify-center w-9 h-9 flex-shrink-0",
      "text-[var(--gesture-accent,#facc15)]",
      className
    )}
  >
    {children}
  </span>
);

/**
 * Normalize SVGR-imported icons so they center + size consistently.
 *
 * If `forceCurrentColor` is true:
 * - overrides baked-in SVG colors to use currentColor
 *
 * If `normalizeStrokeWidth` is set:
 * - forces a consistent stroke width for all descendants
 * - uses non-scaling stroke so scaling doesn't make it look thicker
 */
const CustomSvg = ({
  Svg,
  className,
  scaleClassName = "",
  forceCurrentColor = false,
  normalizeStrokeWidth, // e.g. 1.5
}: {
  Svg: React.ComponentType<any>;
  className?: string;
  scaleClassName?: string;
  forceCurrentColor?: boolean;
  normalizeStrokeWidth?: number;
}) => (
  <IconBox>
    <Svg
      preserveAspectRatio="xMidYMid meet"
      className={cn(
        "block w-full h-full gesture-icon",
        scaleClassName,
        className,

        // Force color to follow currentColor (so menu can be yellow, marker can be black)
        forceCurrentColor
          ? cn("text-current", "[&_*]:!fill-current", "[&_*]:!stroke-current")
          : "",

        // Normalize stroke width if requested (fixes the thick DoubleTap look)
        typeof normalizeStrokeWidth === "number"
          ? cn(
              // Keep strokes from visually thickening when scaled
              "[&_*]:[vector-effect:non-scaling-stroke]",
              // Force consistent stroke width
              `[&_*]:[stroke-width:${normalizeStrokeWidth}]`
            )
          : ""
      )}
    />
  </IconBox>
);

// Hugeicons helper so they also pick up the same sizing/color
const HI = ({ icon }: { icon: any }) => (
  <IconBox>
    <HugeiconsIcon icon={icon} className="w-full h-full gesture-icon block" />
  </IconBox>
);

// ── schema & type ─────────────────────────────────────────────
export const GestureOptionSchema: z.ZodType<{
  value: string;
  label: string;
  icon?: React.ReactNode;
  subGestures?: any;
}> = z.lazy(
  (): z.ZodType<any> =>
    z.object({
      value: z.string(),
      label: z.string(),
      icon: z.custom<React.ReactNode>().optional(),
      subGestures: z.array(GestureOptionSchema).optional(),
    })
);

export type GestureOption = z.infer<typeof GestureOptionSchema>;

// classes consumed by the menu
export const POPOVER_CONTENT_CLASS = "w-50 p-0 overflow-visible";
export const COMMAND_LIST_CLASS = "max-h-none overflow-visible";
export const COMMAND_ITEM_CLASS =
  "cursor-pointer group px-2 py-1 rounded-md relative";

// ── options (ordered) ────────────────────────────────────────
export const gestureOptions: GestureOption[] = [
  { value: "Tap", label: "Tap", icon: <HI icon={Tap01Icon} /> },

  {
    value: "Double tap",
    label: "Double tap",
    /**
     * ✅ Key behavior:
     * - Menu: stays yellow (default --gesture-accent)
     * - Selected marker: turns black (marker sets --gesture-accent to #111)
     *
     * ✅ Fix for stroke looking too thick:
     * - normalizeStrokeWidth forces a consistent stroke width.
     *
     * If you want it slightly thinner/thicker, tweak 1.5 -> 1.25 or 1.75.
     */
    icon: (
      <CustomSvg
        Svg={DoubleTapIcon}
        scaleClassName="scale-[1.11]"
        forceCurrentColor
        normalizeStrokeWidth={1.5}
      />
    ),
  },

  {
    value: "Finger swipe",
    label: "Finger swipe",
    icon: <HI icon={Move01Icon} />,
    subGestures: [
      { value: "Swipe up", label: "Swipe up", icon: <HI icon={SwipeUp01Icon} /> },
      {
        value: "Swipe down",
        label: "Swipe down",
        icon: <HI icon={SwipeDown01Icon} />,
      },
      {
        value: "Swipe left",
        label: "Swipe left",
        icon: <HI icon={SwipeLeft01Icon} />,
      },
      {
        value: "Swipe right",
        label: "Swipe right",
        icon: <HI icon={SwipeRight01Icon} />,
      },
    ],
  },

  {
    value: "Typing",
    label: "Typing",
    icon: (
      <IconBox>
        <Keyboard className="block w-full h-full gesture-icon scale-[0.78]" />
      </IconBox>
    ),
  },

  {
    value: "Touch and hold",
    label: "Touch and hold",
    icon: <CustomSvg Svg={TouchHoldIcon} scaleClassName="scale-[1.08]" />,
  },

  {
    value: "Drag",
    label: "Drag",
    icon: <HI icon={Drag02Icon} />,
    subGestures: [
      {
        value: "Drag up",
        label: "Drag up",
        icon: <CustomSvg Svg={DragUpIcon} scaleClassName="scale-[1.08]" />,
      },
      {
        value: "Drag down",
        label: "Drag down",
        icon: <CustomSvg Svg={DragDownIcon} scaleClassName="scale-[1.08]" />,
      },
      { value: "Drag left", label: "Drag left", icon: <HI icon={DragLeft01Icon} /> },
      {
        value: "Drag right",
        label: "Drag right",
        icon: <HI icon={DragRight01Icon} />,
      },
    ],
  },

  {
    value: "Zoom",
    label: "Zoom",
    icon: <HI icon={Minimize01Icon} />,
    subGestures: [
      { value: "Zoom in", label: "Zoom in", icon: <HI icon={Minimize01Icon} /> },
      { value: "Zoom out", label: "Zoom out", icon: <HI icon={Maximize01Icon} /> },
    ],
  },

  {
    value: "Rotate",
    label: "Rotate",
    icon: <HI icon={RotateSquareIcon} />,
    subGestures: [
      {
        value: "Rotate right",
        label: "Rotate right",
        icon: <HI icon={RotateTopRightIcon} />,
      },
      {
        value: "Rotate left",
        label: "Rotate left",
        icon: <HI icon={RotateTopLeftIcon} />,
      },
    ],
  },

  {
    value: "Other",
    label: "Other",
    icon: (
      <IconBox>
        <CircleHelp className="block w-full h-full gesture-icon scale-[0.78]" />
      </IconBox>
    ),
  },
];
