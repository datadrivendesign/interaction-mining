export type TraceIssueCategory =
  | "gesture_annotation"
  | "description_quality"
  | "missing_screens"
  | "task_recording";

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

export const TRACE_ISSUE_CATEGORIES: Record<
  TraceIssueCategory,
  TraceIssueCategoryMeta
> = {
  gesture_annotation: {
    label: "Gesture Placement / Type",
    description: "Fix gesture position, type, or capture timing around the action.",
  },
  description_quality: {
    label: "Description Quality",
    description: "Clarify what the worker is doing and remove weak or incorrect commentary.",
  },
  missing_screens: {
    label: "Screen Capture / Privacy",
    description: "Add missing states, wait for stable content, and catch privacy redaction issues.",
  },
  task_recording: {
    label: "Flow Realism / Recording",
    description: "Adjust the overall task or recording so it looks realistic and distinct.",
  },
};

export const TRACE_ISSUES: TraceIssue[] = [
  // Gesture Annotation Errors
  {
    id: "misplaced_gesture",
    label: "Misplaced a gesture",
    chipLabel: "Misplaced gesture",
    category: "gesture_annotation",
    annotation: "Screen #: Gesture is not placed in the correct area.",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 1,
  },
  {
    id: "wrong_swipe_direction",
    label: "Wrong swiping direction",
    chipLabel: "Wrong swipe direction",
    category: "gesture_annotation",
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
    category: "gesture_annotation",
    annotation:
      "Screen #: Typing action should be placed on the focused input box not on the keyboard",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 3,
  },
  {
    id: "screen_captured_after_gesture",
    label: "Captured screen AFTER gesture was done, not before",
    chipLabel: "Screen captured after action",
    category: "gesture_annotation",
    annotation:
      "Screen #: Please capture the screen before you did [gesture], not after",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 4,
  },
  {
    id: "swipe_instead_of_tap",
    label:
      'Selected "swipe" to open a tab from menu when it seems to have been a tap',
    chipLabel: "Swipe should be tap",
    category: "gesture_annotation",
    annotation:
      "Screen #: This gesture looks like a tap, not a swipe. Please change it to a tap.",
    destination: "annotation",
    scope: "screen",
  },

  // Annotation Description Quality Issues
  {
    id: "not_enough_description",
    label: "Not enough description in annotation",
    chipLabel: "Too little description",
    category: "description_quality",
    annotation:
      "Screen #: Please describe what you are doing and why, not just the gesture.",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 5,
  },
  {
    id: "typos_in_annotation",
    label: "Typos in the gesture annotation description",
    chipLabel: "Typos in annotation",
    category: "description_quality",
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
    category: "description_quality",
    annotation:
      "Describe what you are doing on screen, not a comment about the task itself.",
    destination: "summarize",
    scope: "flow",
  },

  // Missing Screens / Redaction Issues
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
    id: "captured_before_loading",
    label:
      "Captured screen before content finished loading or in animation (if full screen is in screen recording)",
    chipLabel: "Captured before loading",
    category: "missing_screens",
    annotation:
      "Screen #: Please capture screen after the app has finished loading content or animation",
    destination: "annotation",
    scope: "screen",
    shortcutKey: 8,
  },
  {
    id: "forgot_redact_private_info",
    label: "Forgot to redact private information: email, address, map location",
    chipLabel: "Missing private-info redaction",
    category: "missing_screens",
    annotation: "Screen #: You forgot to redact [ITEM], please cover it.",
    destination: "redaction",
    scope: "screen",
    shortcutKey: 9,
  },
  {
    id: "missing_intermediate_screen",
    label: "Skipped an important intermediate screen between captured states",
    chipLabel: "Missing intermediate screen",
    category: "missing_screens",
    annotation:
      "Screen #: Please capture the missing intermediate screen between this state and the next one.",
    destination: "annotation",
    scope: "screen",
  },
  {
    id: "forgot_initial_screen",
    label: "Forgot initial screen in screenshot but had it on screen recording",
    chipLabel: "Missing initial screen",
    category: "missing_screens",
    annotation:
      "Screen 1: Please include screen opening up app from home screen",
    destination: "annotation",
    scope: "screen",
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

  // Task Recording Issues
  {
    id: "identical_flows",
    label: "Two or more task recordings have almost identical flows",
    chipLabel: "Task flows too similar",
    category: "task_recording",
    annotation:
      'This task flow is too similar to some other tasks in this app. Please change the task recording to something both different and realistic to what a user would do in this app, such as: "[INSERT_TASK_HERE]"',
    destination: "annotation",
    scope: "flow",
  },
  {
    id: "unrealistic_flow",
    label: "Task flow does not reflect typical user behavior",
    chipLabel: "Unrealistic task flow",
    category: "task_recording",
    annotation:
      'This task flow is not very realistic to what a user would normally do in an app. Please change the task recording to something both different and realistic to what a user would do in this app, such as: "[INSERT_TASK_HERE]"',
    destination: "annotation",
    scope: "flow",
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
