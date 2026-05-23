import type { DraftTraceFormData, RuleIssue } from "./types.ts";

const CANONICAL_TYPES = new Set([
  "tap", "double tap", "swipe up", "swipe down", "swipe left", "swipe right",
  "typing", "touch and hold", "drag", "zoom in", "zoom out",
  "rotate cw", "rotate ccw", "other",
]);

const COORD_REQUIRED_TYPES = new Set([
  "tap", "double tap", "touch and hold", "drag", "typing",
]);

export function validate(trace: DraftTraceFormData): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const screens = trace.screens;

  if (screens.length < 3) {
    issues.push({ issueId: "too_few_screens", screenIndex: null, detail: `Only ${screens.length} screen(s); minimum is 3.` });
  }

  const timestamps = screens.map((s) => s.timestamp);
  const seen = new Set<number>();
  for (const ts of timestamps) {
    if (seen.has(ts)) {
      issues.push({ issueId: "duplicate_timestamp", screenIndex: null, detail: `Duplicate timestamp ${ts}s.` });
      break;
    }
    seen.add(ts);
  }

  let prevGesture: { type: string | null; x: number | null; y: number | null } | null = null;

  for (let i = 0; i < screens.length - 1; i++) {
    const screen = screens[i];
    const gesture = trace.gestures[screen.id] ?? null;

    if (!gesture || gesture.type === null || gesture.type === "") {
      issues.push({ issueId: "missing_gesture", screenIndex: i, detail: `Screen ${i + 1} has no gesture type.` });
      prevGesture = null;
      continue;
    }

    const type = gesture.type.trim().toLowerCase();

    if (!CANONICAL_TYPES.has(type)) {
      issues.push({ issueId: "unrecognized_gesture_type", screenIndex: i, detail: `"${gesture.type}" is not a recognized gesture type.` });
    }

    const desc = gesture.description ?? "";
    if (!desc || desc.trim() === "") {
      issues.push({ issueId: "missing_gesture_description", screenIndex: i, detail: `Screen ${i + 1} gesture has no description.` });
    } else if (desc.trim().length < 5) {
      issues.push({ issueId: "short_gesture_description", screenIndex: i, detail: `Screen ${i + 1} description too short: "${desc.trim()}"` });
    }

    if (gesture.x !== null && gesture.y !== null) {
      if (gesture.x < 0 || gesture.x > 1 || gesture.y < 0 || gesture.y > 1) {
        issues.push({ issueId: "gesture_coord_out_of_bounds", screenIndex: i, detail: `Screen ${i + 1} coords (${gesture.x}, ${gesture.y}) out of [0,1] range.` });
      } else {
        if (gesture.y < 0.05) {
          issues.push({ issueId: "outside_safe_area", screenIndex: i, detail: `Screen ${i + 1} coords y=${gesture.y} fall inside the top safe area (notch/status bar).` });
        } else if (gesture.y > 0.98) {
          issues.push({ issueId: "outside_safe_area", screenIndex: i, detail: `Screen ${i + 1} coords y=${gesture.y} fall inside the bottom safe area (home indicator).` });
        }
      }
    } else if (COORD_REQUIRED_TYPES.has(type)) {
      issues.push({ issueId: "missing_gesture_coords", screenIndex: i, detail: `Screen ${i + 1} "${type}" gesture is missing x/y coordinates.` });
    }

    if (type === "drag" && (gesture.scrollDeltaX === null || gesture.scrollDeltaY === null)) {
      issues.push({ issueId: "drag_missing_delta", screenIndex: i, detail: `Screen ${i + 1} drag gesture is missing scrollDelta values.` });
    }

    if (type.startsWith("swipe")) {
      const dx = gesture.scrollDeltaX ?? 0;
      const dy = gesture.scrollDeltaY ?? 0;
      if (type === "swipe up" && dy >= 0) {
        issues.push({ issueId: "swipe_direction_mismatch", screenIndex: i, detail: `Screen ${i + 1}: swipe up but scrollDeltaY=${dy} (expected < 0).` });
      } else if (type === "swipe down" && dy <= 0) {
        issues.push({ issueId: "swipe_direction_mismatch", screenIndex: i, detail: `Screen ${i + 1}: swipe down but scrollDeltaY=${dy} (expected > 0).` });
      } else if (type === "swipe left" && dx >= 0) {
        issues.push({ issueId: "swipe_direction_mismatch", screenIndex: i, detail: `Screen ${i + 1}: swipe left but scrollDeltaX=${dx} (expected < 0).` });
      } else if (type === "swipe right" && dx <= 0) {
        issues.push({ issueId: "swipe_direction_mismatch", screenIndex: i, detail: `Screen ${i + 1}: swipe right but scrollDeltaX=${dx} (expected > 0).` });
      }
    }

    if (type === "typing" && gesture.y !== null && gesture.y > 0.65) {
      issues.push({ issueId: "typing_gesture_wrong_placement", screenIndex: i, detail: `Screen ${i + 1}: typing gesture y=${gesture.y.toFixed(2)} is in keyboard area (> 0.65); should target the input field.` });
    }

    if (type === "typing" && i > 0) {
      const prevScreen = screens[i - 1];
      const prevG = trace.gestures[prevScreen.id];
      if (!prevG || prevG.type !== "tap") {
        issues.push({ issueId: "missing_tap_on_textbox_screen", screenIndex: i, detail: `Screen ${i + 1}: typing gesture not preceded by a tap on the text field.` });
      }
    }

    if (prevGesture && prevGesture.type === type && gesture.x !== null && gesture.y !== null && prevGesture.x !== null && prevGesture.y !== null) {
      const dist = Math.sqrt((gesture.x - prevGesture.x) ** 2 + (gesture.y - prevGesture.y) ** 2);
      if (dist < 0.02) {
        issues.push({ issueId: "duplicate_consecutive_gesture", screenIndex: i, detail: `Screen ${i + 1}: same "${type}" at nearly the same position as screen ${i} (dist=${dist.toFixed(4)}).` });
      }
    }

    prevGesture = { type, x: gesture.x, y: gesture.y };
  }

  return issues;
}
