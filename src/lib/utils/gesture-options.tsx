"use client";

import React from "react";
import { z } from "zod";

import { Keyboard, CircleHelp, Grab } from "lucide-react";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tap01Icon,
  Move01Icon,
  SwipeLeft01Icon,
  SwipeRight01Icon,
  SwipeUp01Icon,
  SwipeDown01Icon,
  Minimize01Icon,
  Maximize01Icon,
  RotateSquareIcon,
  RotateTopLeftIcon,
  RotateTopRightIcon,
} from "@hugeicons/core-free-icons";

// Import your custom SVGs
import DoubleTapIcon from "@/components/ui/gesture-icons/double-tap-01.svg";
import TouchHoldIcon from "@/components/ui/gesture-icons/touch-and-hold.svg";

import { cn } from "@/lib/utils";

const ICON_BOX_SIZE = "w-7 h-7";
const HUGE_ICON_SIZE = "w-7 h-7";
const LUCIDE_ICON_SIZE = "w-7 h-7";
const CUSTOM_ICON_SIZE = "w-7 h-7";

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
      "gesture-icon-box inline-flex items-center justify-center flex-shrink-0",
      ICON_BOX_SIZE,
      "text-[var(--gesture-accent,#854d0e)]", // Inherits amber tone by default, near-black inside marker
      className,
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
}: {
  Svg: React.ComponentType<any>;
  className?: string;
}) => (
  <IconBox>
    <span className={cn("flex items-center justify-center", CUSTOM_ICON_SIZE)}>
      <Svg
        className={cn("block w-full h-full gesture-icon-custom", className)}
        preserveAspectRatio="xMidYMid meet"
      />
    </span>
  </IconBox>
);

// Hugeicons helper
const HugeIconsWrapper = ({ icon }: { icon: any }) => (
  <IconBox>
    <HugeiconsIcon
      icon={icon}
      className={cn("gesture-icon block", HUGE_ICON_SIZE)}
    />
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
    }),
);

export type GestureOption = z.infer<typeof GestureOptionSchema>;

export const POPOVER_CONTENT_CLASS =
  "w-50 p-0 overflow-visible hover:cursor-pointer";
export const COMMAND_LIST_CLASS =
  "max-h-none overflow-visible hover:cursor-pointer";
export const COMMAND_ITEM_CLASS =
  "cursor-pointer group px-2 py-1 rounded-md relative hover:cursor-pointer";

const LEGACY_GESTURE_TYPE_MAP: Record<string, string> = {
  tap: "Tap",
  "double tap": "Double tap",
  swipe: "Finger swipe",
  typing: "Typing",
  "touch and hold": "Touch and hold",
  drag: "Drag",
  "drag up": "Drag",
  "drag down": "Drag",
  "drag left": "Drag",
  "drag right": "Drag",
  zoom: "Zoom",
  "zoom in": "Zoom in",
  "zoom out": "Zoom out",
  rotate: "Rotate",
  "rotate cw": "Rotate right",
  "rotate clockwise": "Rotate right",
  "rotate ccw": "Rotate left",
  "rotate counter-clockwise": "Rotate left",
  other: "Other",
};

// ── options ────────────────────────────────────────
export const gestureOptions: GestureOption[] = [
  { value: "Tap", label: "Tap", icon: <HugeIconsWrapper icon={Tap01Icon} /> },

  {
    value: "Double tap",
    label: "Double tap",
    icon: <CustomSvg Svg={DoubleTapIcon} />,
  },

  {
    value: "Finger swipe",
    label: "Finger swipe",
    icon: <HugeIconsWrapper icon={Move01Icon} />,
    subGestures: [
      {
        value: "Swipe up",
        label: "Swipe up",
        icon: <HugeIconsWrapper icon={SwipeUp01Icon} />,
      },
      {
        value: "Swipe down",
        label: "Swipe down",
        icon: <HugeIconsWrapper icon={SwipeDown01Icon} />,
      },
      {
        value: "Swipe left",
        label: "Swipe left",
        icon: <HugeIconsWrapper icon={SwipeLeft01Icon} />,
      },
      {
        value: "Swipe right",
        label: "Swipe right",
        icon: <HugeIconsWrapper icon={SwipeRight01Icon} />,
      },
    ],
  },

  {
    value: "Typing",
    label: "Typing",
    icon: (
      <IconBox>
        <Keyboard className={cn("gesture-icon block", LUCIDE_ICON_SIZE)} />
      </IconBox>
    ),
  },

  {
    value: "Touch and hold",
    label: "Touch and hold",
    icon: <CustomSvg Svg={TouchHoldIcon} />,
  },

  {
    value: "Drag",
    label: "Drag",
    icon: (
      <IconBox>
        <Grab className={cn("gesture-icon block", LUCIDE_ICON_SIZE)} />
      </IconBox>
    ),
  },

  {
    value: "Zoom",
    label: "Zoom",
    icon: <HugeIconsWrapper icon={Minimize01Icon} />,
    subGestures: [
      {
        value: "Zoom in",
        label: "Zoom in",
        icon: <HugeIconsWrapper icon={Minimize01Icon} />,
      },
      {
        value: "Zoom out",
        label: "Zoom out",
        icon: <HugeIconsWrapper icon={Maximize01Icon} />,
      },
    ],
  },

  {
    value: "Rotate",
    label: "Rotate",
    icon: <HugeIconsWrapper icon={RotateSquareIcon} />,
    subGestures: [
      {
        value: "Rotate right",
        label: "Rotate right",
        icon: <HugeIconsWrapper icon={RotateTopRightIcon} />,
      },
      {
        value: "Rotate left",
        label: "Rotate left",
        icon: <HugeIconsWrapper icon={RotateTopLeftIcon} />,
      },
    ],
  },

  {
    value: "Other",
    label: "Other",
    icon: (
      <IconBox>
        <CircleHelp className={cn("gesture-icon block", LUCIDE_ICON_SIZE)} />
      </IconBox>
    ),
  },
];

export function flattenGestureOptions(
  options: GestureOption[] = gestureOptions,
) {
  return options.flatMap((option) => [option, ...(option.subGestures ?? [])]);
}

export function normalizeGestureType(type: string | null | undefined) {
  if (!type) return null;
  const raw = type.trim();
  if (!raw) return null;

  const allOptions = flattenGestureOptions();
  const exact = allOptions.find((option) => option.value === raw);
  if (exact) return exact.value;

  const lower = raw.toLowerCase();
  const caseInsensitive = allOptions.find(
    (option) => option.value.toLowerCase() === lower,
  );
  if (caseInsensitive) return caseInsensitive.value;

  return LEGACY_GESTURE_TYPE_MAP[lower] ?? null;
}

export function findGestureOption(type: string | null | undefined) {
  const normalized = normalizeGestureType(type);
  if (!normalized) return null;
  return (
    flattenGestureOptions().find((option) => option.value === normalized) ??
    null
  );
}
