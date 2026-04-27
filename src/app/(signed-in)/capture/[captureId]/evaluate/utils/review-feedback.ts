import { FrameData } from "../../edit/components/types";
import { TraceIssueDestination } from "../components/shared/trace-issues";

export interface ReviewComment {
  id: string;
  text: string;
  issueId?: string;
  destination?: TraceIssueDestination;
  imported?: boolean;
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

function normalizeSerializedText(text: string) {
  return text.replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

function ensureScreenPrefix(text: string, screenNumber: number) {
  const normalizedText = normalizeSerializedText(normalizeFeedbackLine(text));
  if (/^Screen \d+:/i.test(normalizedText)) {
    return normalizedText;
  }

  return `Screen ${screenNumber}: ${normalizedText}`;
}

function createImportedComment({
  text,
  destination,
}: {
  text: string;
  destination: TraceIssueDestination;
}): ReviewComment {
  return {
    id: crypto.randomUUID(),
    text,
    destination,
    imported: true,
  };
}

function parseFeedbackLines({
  text,
  destination,
  screens,
}: {
  text?: string | null;
  destination: TraceIssueDestination;
  screens: FrameData[];
}) {
  const commentsByScreen: Record<string, ReviewComment[]> = {};
  const flowComments: ReviewComment[] = [];
  const sortedScreens = [...screens].sort((a, b) => a.timestamp - b.timestamp);

  getFeedbackLines(text).forEach((line) => {
    const normalizedLine = normalizeFeedbackLine(line);
    const screenMatch = normalizedLine.match(/^Screen\s+(\d+):?\s*(.*)$/i);

    if (!screenMatch) {
      flowComments.push(
        createImportedComment({
          text: normalizedLine,
          destination,
        }),
      );
      return;
    }

    const screenNumber = Number.parseInt(screenMatch[1], 10);
    const mappedScreen = sortedScreens[screenNumber - 1];
    if (!mappedScreen) {
      flowComments.push(
        createImportedComment({
          text: normalizedLine,
          destination,
        }),
      );
      return;
    }

    commentsByScreen[mappedScreen.id] = [
      ...(commentsByScreen[mappedScreen.id] ?? []),
      createImportedComment({
        text: normalizedLine,
        destination,
      }),
    ];
  });

  return { commentsByScreen, flowComments };
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

    const serializedLine = normalizeSerializedText(comment.text);
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

export function hydrateReviewFeedbackState({
  screens,
  annotateFeedback,
  redactFeedback,
  summarizeFeedback,
}: {
  screens: FrameData[];
  annotateFeedback?: string | null;
  redactFeedback?: string | null;
  summarizeFeedback?: string | null;
}) {
  const annotateState = parseFeedbackLines({
    text: annotateFeedback,
    destination: "annotation",
    screens,
  });
  const redactState = parseFeedbackLines({
    text: redactFeedback,
    destination: "redaction",
    screens,
  });
  const summarizeState = parseFeedbackLines({
    text: summarizeFeedback,
    destination: "summarize",
    screens,
  });

  const commentsByScreen: Record<string, ReviewComment[]> = {};
  const allScreenIds = new Set<string>([
    ...Object.keys(annotateState.commentsByScreen),
    ...Object.keys(redactState.commentsByScreen),
    ...Object.keys(summarizeState.commentsByScreen),
  ]);

  allScreenIds.forEach((screenId) => {
    commentsByScreen[screenId] = [
      ...(annotateState.commentsByScreen[screenId] ?? []),
      ...(redactState.commentsByScreen[screenId] ?? []),
      ...(summarizeState.commentsByScreen[screenId] ?? []),
    ];
  });

  return {
    commentsByScreen,
    flowComments: [
      ...annotateState.flowComments,
      ...redactState.flowComments,
      ...summarizeState.flowComments,
    ],
  };
}
