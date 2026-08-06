import { findTraceIssue } from "../components/shared/trace-issues";
import { ReviewFeedbackState } from "./review-feedback";

/**
 * Structured shape of a single review verdict, persisted to `CaptureReview`.
 *
 * `serializeReviewFeedbackState` flattens a review into the three prose feedback
 * strings the worker reads, which drops the issue taxonomy the reviewer actually
 * clicked. This keeps that taxonomy so reject reasons stay queryable.
 */
export interface ReviewVerdictSummary {
  /** Stable `TRACE_ISSUES` ids, deduplicated — one review counts an issue once. */
  issueIds: string[];
  issueCategories: string[];
  /** Editor steps the worker is sent back to: annotation, redaction, summarize. */
  destinations: string[];
  screenIssueCount: number;
  flowIssueCount: number;
  screenCount: number;
}

/**
 * Reduces the reviewer's in-progress comments to the structured summary stored
 * alongside a verdict.
 *
 * Ids, categories, and destinations are deduplicated: a trace with the same
 * issue flagged on six screens contributes one id and six to
 * `screenIssueCount`, which keeps "how often is this issue the problem"
 * separate from "how bad was this trace".
 *
 * @param feedbackState - Comments the reviewer has attached to screens and to the flow.
 * @param screenCount - Trace size at review time, for normalizing issue counts.
 */
export function summarizeReviewVerdict({
  feedbackState,
  screenCount,
}: {
  feedbackState: ReviewFeedbackState;
  screenCount: number;
}): ReviewVerdictSummary {
  const screenComments = Object.values(feedbackState.commentsByScreen).flat();
  const allComments = [...screenComments, ...feedbackState.flowComments];

  const issueIds = new Set<string>();
  const issueCategories = new Set<string>();
  const destinations = new Set<string>();

  allComments.forEach((comment) => {
    if (comment.issueId) {
      issueIds.add(comment.issueId);
      const issue = findTraceIssue(comment.issueId);
      if (issue) {
        issueCategories.add(issue.category);
      }
    }
    if (comment.destination) {
      destinations.add(comment.destination);
    }
  });

  return {
    issueIds: Array.from(issueIds),
    issueCategories: Array.from(issueCategories),
    destinations: Array.from(destinations),
    screenIssueCount: screenComments.length,
    flowIssueCount: feedbackState.flowComments.length,
    screenCount,
  };
}
