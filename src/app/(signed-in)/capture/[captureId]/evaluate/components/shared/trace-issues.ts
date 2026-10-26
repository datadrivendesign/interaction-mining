export type TraceIssueCategory =
  | "recording"
  | "missing_screens"
  | "screen_timing"
  | "gesture"
  | "description"
  | "redaction";

export type TraceIssueDestination = "annotation" | "redaction" | "summarize";
export type TraceIssueScope = "screen" | "flow";
export interface TraceIssueCategoryMeta {
  label: string;
  description: string;
}

export interface TraceIssue {
  id: string;
  label: string;
  chipLabel?: string;
  category: TraceIssueCategory;
  annotation: string;
  destination: TraceIssueDestination;
  scope: TraceIssueScope;
  shortcutKey?: number;
}

// Groups mirror the six review checklist steps, in review order.
export const TRACE_ISSUE_CATEGORIES: Record<
  TraceIssueCategory,
  TraceIssueCategoryMeta
> = {
  recording: {
    label: "1. Recording",
    description: "The video must show the assigned task from start to finish.",
  },
  missing_screens: {
    label: "2. Missing screens",
    description: "Every tap, swipe, and typing action needs its own screen.",
  },
  screen_timing: {
    label: "3. Screen timing",
    description:
      "Each screen is captured just before the action, fully loaded, not animating.",
  },
  gesture: {
    label: "4. Gesture",
    description: "Right gesture type, placed on the element that was touched.",
  },
  description: {
    label: "5. Description",
    description:
      "Two parts: the screen element, then the goal. Readable, specific, no typos.",
  },
  redaction: {
    label: "6. Redaction",
    description:
      "Private information covered with small boxes, one box per item.",
  },
};

export const TRACE_ISSUES: TraceIssue[] = [
  // 1. Recording
  {
    id: "wrong_recording",
    label:
      "Wrong recording uploaded, or the recording does not complete the task",
    chipLabel: "Wrong recording / task not done",
    category: "recording",
    annotation:
      "The recording does not match the assigned task, or it does not finish the task. Please record the task again and upload the new video.",
    destination: "annotation",
    scope: "flow",
  },

  // 2. Missing screens
  {
    id: "missing_intermediate_screen",
    label: "A screen is missing between two captured screens",
    chipLabel: "Missing screen",
    category: "missing_screens",
    annotation:
      "Screen #: A screen is missing here. Please add the screen where you [WHICH_ACTION], between this screen and the next one.",
    destination: "annotation",
    scope: "screen",
  },
  {
    id: "missing_tap_on_textbox_screen",
    label:
      "Didn't include screen that was tapping onto text box (before started typing)",
    chipLabel: "Missing text-box tap",
    category: "missing_screens",
    annotation:
      "Screen #: Please include screen tapping text box to open up keyboard before typing",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 7,
  },
  {
    id: "missing_keyboard_submit",
    label: `Didn't capture screen pressing "Done"/"Enter"/"Search" button on keyboard after typing (if needed)`,
    chipLabel: "Missing keyboard submit",
    category: "missing_screens",
    annotation:
      'Screen #: Please capture tapping "Enter" or "Done" on the keyboard if you did this after typing.',
    destination: "annotation",
    scope: "screen",
  },

  // 3. Screen timing
  {
    id: "screen_captured_after_gesture",
    label: "Captured screen AFTER gesture was done, not before",
    chipLabel: "Screen captured after action",
    category: "screen_timing",
    annotation:
      "Screen #: Please capture the screen before you did [gesture], not after",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 4,
  },
  {
    id: "captured_before_loading",
    label:
      "Captured screen before content finished loading or in animation (if full screen is in screen recording)",
    chipLabel: "Captured before loading",
    category: "screen_timing",
    annotation:
      "Screen #: Please capture screen after the app has finished loading content or animation",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 8,
  },

  // 4. Gesture
  {
    id: "misplaced_gesture",
    label: "Misplaced a gesture",
    chipLabel: "Misplaced gesture",
    category: "gesture",
    annotation: "Screen #: Gesture is not placed in the correct area.",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 1,
  },
  {
    id: "wrong_swipe_direction",
    label: "Wrong swiping direction",
    chipLabel: "Wrong swipe direction",
    category: "gesture",
    annotation:
      "Screen #: Fix swipe direction, it should be where your finger is moving, not how the screen moves.",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 2,
  },
  {
    id: "typing_gesture_wrong_placement",
    label: "Not placing typing gesture on text box",
    chipLabel: "Typing not on text box",
    category: "gesture",
    annotation:
      "Screen #: Typing action should be placed on the focused input box not on the keyboard",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 3,
  },
  {
    id: "wrong_gesture_type",
    label: "Wrong gesture type selected (tap, swipe, type, long press)",
    chipLabel: "Wrong gesture type",
    category: "gesture",
    annotation:
      "Screen #: The gesture type is wrong. This looks like a [CORRECT_GESTURE], not a [WRONG_GESTURE]. Please change the gesture type.",
    destination: "annotation",
    scope: "screen",
  },

  // 5. Description
  {
    id: "not_enough_description",
    label: "Not enough description in annotation",
    chipLabel: "Too little description",
    category: "description",
    annotation:
      "Screen #: Please write the description in two parts. First part: the screen element you used (for example: button, list item, tab, icon, text box). Second part: what you wanted to do (for example: open the settings page).",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 5,
  },
  {
    id: "wrong_element_type",
    label: "Screen element type is missing, wrong, or not specific",
    chipLabel: "Wrong element type",
    category: "description",
    annotation:
      "Screen #: Fix the screen element type in the first part of the description. This element is a [CORRECT_TYPE], not a [WRONG_TYPE]. Common types: button, list item, tab, icon, text box, toggle.",
    destination: "annotation",
    scope: "screen",
  },
  {
    id: "vague_action_goal",
    label: "Action goal is missing, wrong, or not specific",
    chipLabel: "Vague action goal",
    category: "description",
    annotation:
      'Screen #: The second part of the description must say what you wanted to do, in a specific way. For example: "find the article about football playoffs", not "tap the item".',
    destination: "annotation",
    scope: "screen",
  },
  {
    id: "typos_in_annotation",
    label: "Typos in the gesture annotation description",
    chipLabel: "Typos in annotation",
    category: "description",
    annotation: "Screen #: Fix misspelling of [word]",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 6,
  },
  {
    id: "task_description_commentary",
    label:
      "Wrote task description as commentary about task rather than describing.",
    chipLabel: "Task description is commentary",
    category: "description",
    annotation:
      "Describe what you are doing on screen, not a comment about the task itself.",
    destination: "summarize",
    scope: "flow",
  },

  // 6. Redaction
  {
    id: "forgot_redact_private_info",
    label: "Forgot to redact private information: email, address, map location",
    chipLabel: "Missing private-info redaction",
    category: "redaction",
    annotation: "Screen #: You forgot to redact [ITEM], please cover it.",
    destination: "redaction",
    scope: "screen",
    shortcutKey: 9,
  },
  {
    id: "redaction_too_large",
    label: "Redaction box is too large or covers several private items",
    chipLabel: "Redaction too large / split",
    category: "redaction",
    annotation:
      "Screen #: Make the black box smaller so it only covers the private information. Use one box for each private item. Do not cover other text or icons.",
    destination: "redaction",
    scope: "screen",
  },
];

export const ISSUES_BY_CATEGORY = TRACE_ISSUES.reduce(
  (acc, issue) => {
    if (!acc[issue.category]) acc[issue.category] = [];
    acc[issue.category].push(issue);
    return acc;
  },
  {} as Record<TraceIssueCategory, TraceIssue[]>,
);

export function findTraceIssue(issueId: string) {
  return TRACE_ISSUES.find((issue) => issue.id === issueId);
}

export function findTraceIssueByShortcut(shortcutKey: number) {
  return TRACE_ISSUES.find((issue) => issue.shortcutKey === shortcutKey);
}
