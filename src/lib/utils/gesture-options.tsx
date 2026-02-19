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

// Import your custom SVGs
import DoubleTapIcon from "@/components/ui/gesture-icons/double-tap-01.svg";
import TouchHoldIcon from "@/components/ui/gesture-icons/touch-and-hold.svg";
import DragUpIcon from "@/components/ui/gesture-icons/drag-up-01.svg";
import DragDownIcon from "@/components/ui/gesture-icons/drag-down-01.svg";

import { cn } from "@/lib/utils";

/**
 * Shared icon wrapper
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
      "text-[var(--gesture-accent,#facc15)]", // Inherits Yellow by default, Black when inside marker
      className
    )}
  >
    {children}
  </span>
);

/**
 * Custom SVG Wrapper
 * Increased baseline size from 75% to 85% to match standard icons better.
 */
const CustomSvg = ({
  Svg,
  className,
  containerClassName,
}: {
  Svg: React.ComponentType<any>;
  className?: string;
  containerClassName?: string;
}) => (
  <IconBox>
    <span className={cn("flex items-center justify-center w-[85%] h-[85%]", containerClassName)}>
      <Svg
        className={cn(
          "block w-full h-full gesture-icon-custom", // Custom class for globals.css overrides
          className
        )}
        preserveAspectRatio="xMidYMid meet"
      />
    </span>
  </IconBox>
);

// Hugeicons helper
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

export const POPOVER_CONTENT_CLASS = "w-50 p-0 overflow-visible";
export const COMMAND_LIST_CLASS = "max-h-none overflow-visible";
export const COMMAND_ITEM_CLASS =
  "cursor-pointer group px-2 py-1 rounded-md relative";

// ── options ────────────────────────────────────────
export const gestureOptions: GestureOption[] = [
  { value: "Tap", label: "Tap", icon: <HI icon={Tap01Icon} /> },

  {
    value: "Double tap",
    label: "Double tap",
    // scale-[1.15] makes it larger. translate nudges it into the exact center.
    icon: <CustomSvg Svg={DoubleTapIcon} containerClassName="scale-[1.15] translate-x-[2px] translate-y-[2px]" />,
  },

  {
    value: "Finger swipe",
    label: "Finger swipe",
    icon: <HI icon={Move01Icon} />,
    subGestures: [
      { value: "Swipe up", label: "Swipe up", icon: <HI icon={SwipeUp01Icon} /> },
      { value: "Swipe down", label: "Swipe down", icon: <HI icon={SwipeDown01Icon} /> },
      { value: "Swipe left", label: "Swipe left", icon: <HI icon={SwipeLeft01Icon} /> },
      { value: "Swipe right", label: "Swipe right", icon: <HI icon={SwipeRight01Icon} /> },
    ],
  },

  {
    value: "Typing",
    label: "Typing",
    icon: (
      <IconBox>
        <Keyboard className="block w-[80%] h-[80%] gesture-icon" />
      </IconBox>
    ),
  },

  {
    value: "Touch and hold",
    label: "Touch and hold",
    // scale-[1.15] makes it larger. translate nudges it into the exact center.
    icon: <CustomSvg Svg={TouchHoldIcon} containerClassName="scale-[1.15] translate-x-[2.2px] translate-y-[2px]" />,
  },

  {
    value: "Drag",
    label: "Drag",
    icon: <HI icon={Drag02Icon} />,
    subGestures: [
      {
        value: "Drag up",
        label: "Drag up",
        // Fixed invalid translate-y--2 to -translate-y-[2px]
        icon: <CustomSvg Svg={DragUpIcon} containerClassName="translate-x-[2.2px] -translate-y-[2px]" />,
      },
      {
        value: "Drag down",
        label: "Drag down",
        // Fixed invalid translate-y--2 to -translate-y-[2px]
        icon: <CustomSvg Svg={DragDownIcon} containerClassName="translate-x-[2px] -translate-y-[2px]" />,
      },
      { value: "Drag left", label: "Drag left", icon: <HI icon={DragLeft01Icon} /> },
      { value: "Drag right", label: "Drag right", icon: <HI icon={DragRight01Icon} /> },
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
      { value: "Rotate right", label: "Rotate right", icon: <HI icon={RotateTopRightIcon} /> },
      { value: "Rotate left", label: "Rotate left", icon: <HI icon={RotateTopLeftIcon} /> },
    ],
  },

  {
    value: "Other",
    label: "Other",
    icon: (
      <IconBox>
        <CircleHelp className="block w-[80%] h-[80%] gesture-icon" />
      </IconBox>
    ),
  },
];