import {
  SCREEN_ANNOTATION_ISSUE_ACTIONS,
  ScreenAnnotationIssue,
  getScreenAnnotationIssue,
} from "../components/repair-screen/util/gesture-description-template";
import { TraceFormData, TraceFormSchema } from "../components/types";
import { countUnlabelledRedactions } from "./redaction-completeness";

/*
 * The checks a trace must pass before it moves on: the worker's Finish on the
 * edit page, and every Approve on the review page (where staff can fix a
 * trace in place without going through Finish).
 */

export type IncompleteScreen = {
  screenNumber: number;
  issue: ScreenAnnotationIssue;
};

/**
 * Screens whose annotation is unfinished, numbered the way the filmstrip numbers
 * them. The last screen is the goal state and needs no gesture.
 *
 * Scanned per screen rather than parsed with a zod schema. Zod skips a `.refine`
 * when the schema beneath it failed, and the ways an annotation can be
 * incomplete sit at different levels — a missing marker fails field validation,
 * unfilled template slots fail a refine, a screen with no gesture at all fails a
 * different refine — so any field-level failure hid the rest. Both gates share
 * this function so they cannot drift apart or under-report.
 */
export function collectIncompleteScreens(
  screens: TraceFormData["screens"],
  gestures: TraceFormData["gestures"],
): IncompleteScreen[] {
  return screens
    .slice(0, -1)
    .map((screen, index) => ({
      screenNumber: index + 1,
      issue: getScreenAnnotationIssue(gestures[screen.id]),
    }))
    .filter((entry): entry is IncompleteScreen => entry.issue !== null);
}

export type UnlabelledRedactionScreen = {
  screenNumber: number;
  boxCount: number;
};

/**
 * Screens carrying redaction boxes with no label, numbered the way the filmstrip
 * numbers them.
 *
 * Scanned rather than parsed for the same reason as `collectIncompleteScreens`:
 * `RedactionSchema`'s refine returns on the first unlabelled box and reports one
 * record-level message, so it can say neither which screen nor how many boxes.
 *
 * Slightly stricter than the schema, which only rejects an empty string — a
 * whitespace-only label is no more useful to a reviewer than a blank one.
 */
export function collectUnlabelledRedactions(
  screens: TraceFormData["screens"],
  redactions: TraceFormData["redactions"],
): UnlabelledRedactionScreen[] {
  return screens
    .map((screen, index) => ({
      screenNumber: index + 1,
      boxCount: countUnlabelledRedactions(redactions[screen.id]),
    }))
    .filter((entry) => entry.boxCount > 0);
}

/** One message naming the screens whose redaction boxes still need labels. */
export function describeUnlabelledRedactions(
  entries: UnlabelledRedactionScreen[],
): string {
  const describe = (entry: UnlabelledRedactionScreen) =>
    `Screen ${entry.screenNumber}: label ${
      entry.boxCount === 1
        ? "the redaction box"
        : `${entry.boxCount} redaction boxes`
    }`;

  if (entries.length === 1) {
    return `${describe(entries[0])}.`;
  }
  if (entries.length <= 4) {
    return `${entries.length} screens need work — ${entries.map(describe).join("; ")}.`;
  }
  return `${entries.length} screens have unlabelled redaction boxes: ${entries
    .map((entry) => entry.screenNumber)
    .join(", ")}.`;
}

/**
 * One message saying what each unfinished screen needs. Past four screens the
 * reasons stop fitting a toast, so it falls back to screen numbers.
 */
export function describeIncompleteScreens(entries: IncompleteScreen[]): string {
  const describe = (entry: IncompleteScreen) =>
    `Screen ${entry.screenNumber}: ${SCREEN_ANNOTATION_ISSUE_ACTIONS[entry.issue]}`;

  if (entries.length === 1) {
    return `${describe(entries[0])}.`;
  }
  if (entries.length <= 4) {
    return `${entries.length} screens need work — ${entries.map(describe).join("; ")}.`;
  }
  return `${entries.length} screens need work: ${entries
    .map((entry) => entry.screenNumber)
    .join(", ")}. Open each screen to see what it needs.`;
}

/**
 * Everything that would stop this trace from being finished, as messages for
 * the person approving it; empty when it is complete. Unfinished screens and
 * unlabelled redaction boxes are both reported, so one Approve shows all the
 * work left. The schema (the task description and anything malformed) runs
 * only when those pass, since its messages would repeat them less clearly.
 * The last screen is the goal state and needs no gesture.
 */
export function getTraceCompletenessIssues(data: TraceFormData): string[] {
  const issues: string[] = [];
  const incompleteScreens = collectIncompleteScreens(
    data.screens,
    data.gestures,
  );
  if (incompleteScreens.length > 0) {
    issues.push(describeIncompleteScreens(incompleteScreens));
  }
  const unlabelledRedactions = collectUnlabelledRedactions(
    data.screens,
    data.redactions,
  );
  if (unlabelledRedactions.length > 0) {
    issues.push(describeUnlabelledRedactions(unlabelledRedactions));
  }
  if (issues.length > 0) return issues;

  const allButLastScreenIds = new Set(
    data.screens.slice(0, -1).map((screen) => screen.id),
  );
  const validation = TraceFormSchema.safeParse({
    ...data,
    gestures: Object.fromEntries(
      Object.entries(data.gestures).filter(([id]) =>
        allButLastScreenIds.has(id),
      ),
    ),
  });
  if (validation.success) return [];
  // The schema reports per field, so one cause can repeat with one wording.
  return Array.from(
    new Set(validation.error.issues.map((issue) => issue.message)),
  );
}
