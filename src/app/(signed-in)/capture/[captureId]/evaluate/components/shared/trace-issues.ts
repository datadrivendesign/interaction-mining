export type TraceIssueCategory =
  | "gesture_annotation"
  | "description_quality"
  | "missing_screens"
  | "task_recording";

export interface TraceIssue {
  id: string;
  label: string;
  category: TraceIssueCategory;
  annotation: string;
}

export const TRACE_ISSUE_CATEGORIES: Record<TraceIssueCategory, string> = {
  gesture_annotation: "Gesture Annotation Errors",
  description_quality: "Annotation Description Quality",
  missing_screens: "Missing Screens / Redaction",
  task_recording: "Task Recording Issues",
};

export const TRACE_ISSUES: TraceIssue[] = [
  // Gesture Annotation Errors
  {
    id: "misplaced_gesture",
    label: "Misplaced a gesture",
    category: "gesture_annotation",
    annotation: "Screen #: Gesture is not placed in the correct area.",
  },
  {
    id: "typing_gesture_wrong_placement",
    label: "Typing gesture not on text box",
    category: "gesture_annotation",
    annotation:
      "Screen #: Typing action should be placed on the focused input box not on the keyboard",
  },
  {
    id: "wrong_swipe_direction",
    label: "Wrong swiping direction",
    category: "gesture_annotation",
    annotation:
      "Screen #: Fix swipe direction, it should be where your finger is moving, not how the screen moves.",
  },
  {
    id: "screen_captured_after_gesture",
    label: "Screen captured AFTER gesture, not before",
    category: "gesture_annotation",
    annotation:
      "Screen #: Please capture the screen before you did [gesture], not after",
  },
  {
    id: "swipe_instead_of_tap",
    label: "Selected swipe when should be tap",
    category: "gesture_annotation",
    annotation:
      'Selected "swipe" to open a tab from menu when it seems to have been a tap',
  },

  // Annotation Description Quality Issues
  {
    id: "typos_in_annotation",
    label: "Typos in annotation description",
    category: "description_quality",
    annotation: "Screen #: Fix misspelling of [word]",
  },
  {
    id: "not_enough_description",
    label: "Not enough description in annotation",
    category: "description_quality",
    annotation:
      "Screen #: Please be more descriptive describing intention behind annotation",
  },
  {
    id: "task_description_commentary",
    label: "Task description is commentary, not description",
    category: "description_quality",
    annotation:
      "Annotation should be description of task not a comment about the task itself",
  },

  // Missing Screens / Redaction Issues
  {
    id: "forgot_redact_private_info",
    label: "Forgot to redact private information",
    category: "missing_screens",
    annotation: "Screen #: You forgot to redact [ITEM], please cover it.",
  },
  {
    id: "forgot_initial_screen",
    label: "Forgot initial screen (app open)",
    category: "missing_screens",
    annotation:
      "Screen 1: Please include screen opening up app from home screen",
  },
  {
    id: "missing_tap_on_textbox_screen",
    label: "Missing screen tapping text box",
    category: "missing_screens",
    annotation:
      "Screen #: Please include screen tapping text box to open up keyboard before typing",
  },
  {
    id: "missing_keyboard_submit",
    label: 'Missing Done/Enter/Search button capture',
    category: "missing_screens",
    annotation:
      'Screen #: Please capture tapping "Enter" or "Done" on the keyboard if you did this after typing.',
  },
  {
    id: "captured_before_loading",
    label: "Screen captured before content finished loading",
    category: "missing_screens",
    annotation:
      "Screen #: Please capture screen after the app has finished loading content or animation",
  },

  // Task Recording Issues
  {
    id: "identical_flows",
    label: "Task recordings have identical flows",
    category: "task_recording",
    annotation:
      'This task flow is too similar to some other tasks in this app. Please change the task recording to something both different and realistic to what a user would do in this app, such as: "[INSERT_TASK_HERE]"',
  },
  {
    id: "unrealistic_flow",
    label: "Task flow does not reflect typical user behavior",
    category: "task_recording",
    annotation:
      'This task flow is not very realistic to what a user would normally do in an app. Please change the task recording to something both different and realistic to what a user would do in this app, such as: "[INSERT_TASK_HERE]"',
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
