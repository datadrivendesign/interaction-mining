"use client";

import { ReviewComment } from "../../../utils/review-feedback";
import { findTraceIssue, TraceIssueDestination } from "../trace-issues";

export type ReviewCommentTarget = "screen" | "flow";

const SCREEN_NUMBER_TOKEN = /Screen #/g;
const PLACEHOLDER_TOKEN = /\[([^\]]+)\]/g;

export function getTemplatePlaceholders(template: string) {
  return Array.from(
    new Set(
      Array.from(template.matchAll(PLACEHOLDER_TOKEN), (match) => match[1]),
    ),
  );
}

export function fillIssueTemplate(
  template: string,
  screenNumber: number,
  placeholderValues: Record<string, string> = {},
) {
  return template
    .replace(SCREEN_NUMBER_TOKEN, `Screen ${screenNumber}`)
    .replace(PLACEHOLDER_TOKEN, (match, token: string) => {
      const value = placeholderValues[token]?.trim();
      return value ? value : match;
    });
}

export function formatPlaceholderLabel(token: string) {
  return token
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function getCommentLabel(comment: ReviewComment) {
  return findTraceIssue(comment.issueId ?? "")?.label ?? "Custom issue";
}

export function getDestinationLabel(destination?: TraceIssueDestination) {
  if (destination === "redaction") return "Redaction";
  if (destination === "summarize") return "Summarize";
  return "Annotation";
}
