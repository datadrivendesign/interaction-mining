import type { ScreenGesture } from "../types.ts";
import type { Action, FrameJson, StepRecord, Target } from "./vendored-dcc-types.ts";

export type MappedGesture = {
  gesture: ScreenGesture;
  screenshotPath: string;
};

const DROP_TYPES = new Set(["key", "navigate_back", "navigate_home", "wait", "finding"]);

function sanitizeGoal(reason: string): string {
  const trimmed = reason.replace(/\s+/g, " ").trim();
  return (trimmed.slice(0, 80) || "advance the task");
}

function resolveCoords(
  target: Target,
  frame: FrameJson
): { x: number; y: number } | null {
  if (target.by === "pixel") {
    return { x: target.x, y: target.y };
  }
  if (target.by === "index") {
    const el = frame.semanticTree?.find((e) => e.index === target.index);
    if (!el) return null;
    return {
      x: el.center.x / frame.viewport.width,
      y: el.center.y / frame.viewport.height,
    };
  }
  // by:description — grounding failure, drop
  return null;
}

function getLabel(target: Target, frame: FrameJson): string {
  if (target.by === "index") {
    const el = frame.semanticTree?.find((e) => e.index === target.index);
    return el?.label || "the element";
  }
  return "the element";
}

function buildDescription(type: string, label: string, goal: string): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (type === "tap") return `Tap ${label} to ${goal}`;
  if (type === "typing") return `Type in ${label} to ${goal}`;
  if (type.startsWith("swipe")) return `${cap(type)} on ${label} to ${goal}`;
  return `Interact with ${label} to ${goal}`;
}

// Returns null → drop this step entirely
export function mapStep(
  record: StepRecord,
  frame: FrameJson,
  screenshotPath: string,
  prevTapCoords: { x: number; y: number } | null,
  goal: string
): MappedGesture | null {
  const { action } = record;
  const sanitized = sanitizeGoal(record.reason);

  if (DROP_TYPES.has(action.type)) return null;

  if (action.type === "click") {
    const coords = resolveCoords(action.target, frame);
    if (!coords) return null;
    const label = getLabel(action.target, frame);
    return {
      screenshotPath,
      gesture: {
        type: "tap",
        description: buildDescription("tap", label, sanitized),
        x: coords.x,
        y: coords.y,
        scrollDeltaX: null,
        scrollDeltaY: null,
      },
    };
  }

  if (action.type === "type") {
    let coords: { x: number; y: number } | null = null;
    let label = "the element";
    if (action.target) {
      coords = resolveCoords(action.target, frame);
      label = getLabel(action.target, frame);
    } else {
      coords = prevTapCoords;
    }
    if (!coords) return null;
    return {
      screenshotPath,
      gesture: {
        type: "typing",
        description: buildDescription("typing", label, sanitized),
        x: coords.x,
        y: coords.y,
        scrollDeltaX: null,
        scrollDeltaY: null,
      },
    };
  }

  if (action.type === "scroll") {
    const dir = action.direction;
    const swipeType = `swipe ${dir}` as const;
    const scrollDeltaX =
      dir === "left" ? -0.3 : dir === "right" ? 0.3 : null;
    const scrollDeltaY =
      dir === "up" ? -0.3 : dir === "down" ? 0.3 : null;
    return {
      screenshotPath,
      gesture: {
        type: swipeType,
        description: buildDescription(swipeType, "the screen", sanitized),
        x: null,
        y: null,
        scrollDeltaX,
        scrollDeltaY,
      },
    };
  }

  // done is handled by convert.ts as the trailing screen — not a gesture screen
  if (action.type === "done") return null;

  return null;
}
