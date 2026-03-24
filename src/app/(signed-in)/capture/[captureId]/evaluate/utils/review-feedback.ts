import { FrameData } from "../../edit/components/types";
import { TraceIssueDestination } from "../components/shared/trace-issues";

export interface ReviewComment {
  id: string;
  text: string;
  issueId?: string;
  destination?: TraceIssueDestination;
}

export interface ReviewFeedbackState {
  commentsByScreen: Record<string, ReviewComment[]>;
  flowComments: ReviewComment[];
}

export const EMPTY_REVIEW_FEEDBACK_STATE: ReviewFeedbackState = {
  commentsByScreen: {},
  flowComments: [],
};

function getFeedbackLines(text?: string | null) {
  if (!text) {
    return [];
  }

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeFeedbackLine(text: string) {
  return text.replace(/^\s*(?:[-*•]\s+|\d+\.\s+)?/, "").trim();
}

function ensureScreenPrefix(text: string, screenNumber: number) {
  const normalizedText = normalizeFeedbackLine(text);
  if (/^Screen \d+:/i.test(normalizedText)) {
    return normalizedText;
  }

  return `Screen ${screenNumber}: ${normalizedText}`;
}

export function serializeReviewFeedbackState({
  feedbackState,
  screens,
}: {
  feedbackState: ReviewFeedbackState;
  screens: FrameData[];
}) {
  const annotateLines: string[] = [];
  const redactLines: string[] = [];
  const summarizeLines: string[] = [];

  const sortedScreens = [...screens].sort((a, b) => a.timestamp - b.timestamp);

  sortedScreens.forEach((screen, index) => {
    const screenComments = feedbackState.commentsByScreen[screen.id] ?? [];
    screenComments.forEach((comment) => {
      if (!comment.destination) {
        return;
      }

      const serializedLine = ensureScreenPrefix(comment.text, index + 1);
      if (comment.destination === "redaction") {
        redactLines.push(serializedLine);
        return;
      }
      if (comment.destination === "summarize") {
        summarizeLines.push(serializedLine);
        return;
      }
      annotateLines.push(serializedLine);
    });
  });

  feedbackState.flowComments.forEach((comment) => {
    if (!comment.destination) {
      return;
    }

    const serializedLine = comment.text.trim();
    if (!serializedLine) {
      return;
    }

    if (comment.destination === "redaction") {
      redactLines.push(serializedLine);
      return;
    }
    if (comment.destination === "summarize") {
      summarizeLines.push(serializedLine);
      return;
    }
    annotateLines.push(serializedLine);
  });

  return {
    annotateFeedback: annotateLines.join("\n"),
    redactFeedback: redactLines.join("\n"),
    summarizeFeedback: summarizeLines.join("\n"),
  };
}

export function mergeFeedbackStrings(existing?: string | null, next?: string) {
  const mergedLines = [
    ...getFeedbackLines(existing),
    ...getFeedbackLines(next),
  ];
  const dedupedLines: string[] = [];
  const seen = new Set<string>();

  mergedLines.forEach((line) => {
    if (seen.has(line)) {
      return;
    }
    seen.add(line);
    dedupedLines.push(line);
  });

  return dedupedLines.join("\n");
}
