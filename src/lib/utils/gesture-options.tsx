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
import { GESTURE_GROUP_TYPES, GESTURE_TYPES } from "@/lib/utils/gesture-types";

const ICON_BOX_SIZE = "w-6 h-6";
const HUGE_ICON_SIZE = "w-6 h-6";
const LUCIDE_ICON_SIZE = "w-6 h-6";
const CUSTOM_ICON_SIZE = "w-6 h-6";

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
  Tap: GESTURE_TYPES.TAP,
  "Double tap": GESTURE_TYPES.DOUBLE_TAP,
  "Finger Swipe": GESTURE_GROUP_TYPES.SWIPE,
  Typing: GESTURE_TYPES.TYPING,
  "Touch and hold": GESTURE_TYPES.TOUCH_AND_HOLD,
  Drag: GESTURE_TYPES.DRAG,
  "Drag up": GESTURE_TYPES.DRAG,
  "Drag down": GESTURE_TYPES.DRAG,
  "Drag left": GESTURE_TYPES.DRAG,
  "Drag right": GESTURE_TYPES.DRAG,
  Zoom: GESTURE_GROUP_TYPES.ZOOM,
  "Zoom in": GESTURE_TYPES.ZOOM_IN,
  "Zoom out": GESTURE_TYPES.ZOOM_OUT,
  Rotate: GESTURE_GROUP_TYPES.ROTATE,
  "Rotate right": GESTURE_TYPES.ROTATE_CW,
  "Rotate left": GESTURE_TYPES.ROTATE_CCW,
  Other: GESTURE_TYPES.OTHER,
};

// ── options ────────────────────────────────────────
export const gestureOptions: GestureOption[] = [
  {
    value: GESTURE_TYPES.TAP,
    label: "Tap",
    icon: <HugeIconsWrapper icon={Tap01Icon} />,
  },

  {
    value: GESTURE_TYPES.DOUBLE_TAP,
    label: "Double tap",
    icon: <CustomSvg Svg={DoubleTapIcon} />,
  },

  {
    value: GESTURE_GROUP_TYPES.SWIPE,
    label: "Finger swipe",
    icon: <HugeIconsWrapper icon={Move01Icon} />,
    subGestures: [
      {
        value: GESTURE_TYPES.SWIPE_UP,
        label: "Swipe up",
        icon: <HugeIconsWrapper icon={SwipeUp01Icon} />,
      },
      {
        value: GESTURE_TYPES.SWIPE_DOWN,
        label: "Swipe down",
        icon: <HugeIconsWrapper icon={SwipeDown01Icon} />,
      },
      {
        value: GESTURE_TYPES.SWIPE_LEFT,
        label: "Swipe left",
        icon: <HugeIconsWrapper icon={SwipeLeft01Icon} />,
      },
      {
        value: GESTURE_TYPES.SWIPE_RIGHT,
        label: "Swipe right",
        icon: <HugeIconsWrapper icon={SwipeRight01Icon} />,
      },
    ],
  },

  {
    value: GESTURE_TYPES.TYPING,
    label: "Typing",
    icon: (
      <IconBox>
        <Keyboard className={cn("gesture-icon block", LUCIDE_ICON_SIZE)} />
      </IconBox>
    ),
  },

  {
    value: GESTURE_TYPES.TOUCH_AND_HOLD,
    label: "Touch and hold",
    icon: <CustomSvg Svg={TouchHoldIcon} />,
  },

  {
    value: GESTURE_TYPES.DRAG,
    label: "Drag",
    icon: (
      <IconBox>
        <Grab className={cn("gesture-icon block", LUCIDE_ICON_SIZE)} />
      </IconBox>
    ),
  },

  {
    value: GESTURE_GROUP_TYPES.ZOOM,
    label: "Zoom",
    icon: <HugeIconsWrapper icon={Minimize01Icon} />,
    subGestures: [
      {
        value: GESTURE_TYPES.ZOOM_IN,
        label: "Zoom in",
        icon: <HugeIconsWrapper icon={Minimize01Icon} />,
      },
      {
        value: GESTURE_TYPES.ZOOM_OUT,
        label: "Zoom out",
        icon: <HugeIconsWrapper icon={Maximize01Icon} />,
      },
    ],
  },

  {
    value: GESTURE_GROUP_TYPES.ROTATE,
    label: "Rotate",
    icon: <HugeIconsWrapper icon={RotateSquareIcon} />,
    subGestures: [
      {
        value: GESTURE_TYPES.ROTATE_CW,
        label: "Rotate right",
        icon: <HugeIconsWrapper icon={RotateTopRightIcon} />,
      },
      {
        value: GESTURE_TYPES.ROTATE_CCW,
        label: "Rotate left",
        icon: <HugeIconsWrapper icon={RotateTopLeftIcon} />,
      },
    ],
  },

  {
    value: GESTURE_TYPES.OTHER,
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
