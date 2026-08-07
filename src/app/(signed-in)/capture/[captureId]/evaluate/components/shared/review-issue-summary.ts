import { ReviewFeedbackState } from "../../utils/review-feedback";

export function getReviewIssueSummary(feedbackState: ReviewFeedbackState) {
  const totalScreenIssues = Object.values(
    feedbackState.commentsByScreen,
  ).reduce((count, comments) => count + comments.length, 0);
  const flowIssueCount = feedbackState.flowComments.length;
  const totalIssues = totalScreenIssues + flowIssueCount;
  const screensWithIssues = Object.values(
    feedbackState.commentsByScreen,
  ).filter((comments) => comments.length > 0).length;

  return totalIssues === 0
    ? "No issues flagged"
    : `${totalIssues} issue${totalIssues === 1 ? "" : "s"} across ${screensWithIssues} screen${screensWithIssues === 1 ? "" : "s"}${flowIssueCount > 0 ? ` and ${flowIssueCount} flow-level issue${flowIssueCount === 1 ? "" : "s"}` : ""}`;
}
