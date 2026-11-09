import type { ReviewFeedbackState } from "../../utils/review-feedback";
import type { TraceIssueCategory } from "./trace-issues";

/** The six review steps, in the order a reviewer checks them. */
export const CHECKLIST_STEPS: readonly TraceIssueCategory[] = [
  "recording",
  "missing_screens",
  "screen_timing",
  "gesture",
  "description",
  "redaction",
];

export type ChecklistMark = "pass" | "issue";

/** The reviewer's mark per step; a step with no mark is not checked yet. */
export type ReviewChecklist = Partial<
  Record<TraceIssueCategory, ChecklistMark>
>;

export type ChecklistStatus = {
  checkedCount: number;
  /** Shown in the verdict bar, e.g. "4 of 6 steps checked". */
  label: string;
  /** Why Approve is off, or null when it is allowed. */
  approveBlockedReason: string | null;
  /** Why Send back is off, or null when it is allowed. */
  sendBackBlockedReason: string | null;
};

function countNotes(feedbackState: ReviewFeedbackState) {
  return (
    feedbackState.flowComments.length +
    Object.values(feedbackState.commentsByScreen).reduce(
      (count, comments) => count + comments.length,
      0,
    )
  );
}

/**
 * The reviewer's verdict gate. Approve needs all six steps marked Pass. Send
 * back needs at least one note for the worker (an issue or a custom note).
 */
export function getChecklistStatus(
  checklist: ReviewChecklist,
  feedbackState: ReviewFeedbackState,
): ChecklistStatus {
  const marks = CHECKLIST_STEPS.map((step) => checklist[step]);
  const checkedCount = marks.filter(Boolean).length;
  const allPass = marks.every((mark) => mark === "pass");
  const hasIssueStep = marks.some((mark) => mark === "issue");
  const noteCount = countNotes(feedbackState);

  // The notes are what the worker gets, so any note allows Send back,
  // including a custom one that belongs to no step.
  let sendBackBlockedReason: string | null = null;
  if (noteCount === 0) {
    sendBackBlockedReason = hasIssueStep
      ? "To send back, add a note for the worker."
      : "To send back, add a note for the worker: pick an issue or write your own.";
  }

  return {
    checkedCount,
    label: `${checkedCount} of ${CHECKLIST_STEPS.length} steps checked`,
    approveBlockedReason: allPass
      ? null
      : `To approve, mark all ${CHECKLIST_STEPS.length} steps Pass.`,
    sendBackBlockedReason,
  };
}

/**
 * "Pass all" for a clean capture: marks every step Pass except steps the
 * reviewer already marked Issue.
 */
export function passUnflaggedSteps(
  checklist: ReviewChecklist,
): ReviewChecklist {
  const next: ReviewChecklist = { ...checklist };
  for (const step of CHECKLIST_STEPS) {
    if (next[step] !== "issue") next[step] = "pass";
  }
  return next;
}
