import { FrameData } from "../../edit/components/types";
import { TraceIssueDestination } from "../components/shared/trace-issues";

export interface ReviewComment {
  id: string;
  text: string;
  issueId?: string;
  destination?: TraceIssueDestination;
  screenIds?: string[];
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

const SCREEN_LINE_REGEX = /^Screen\s+(\d+):?\s*(.*)$/i;
const SCREEN_ID_TOKEN_REGEX = /\s*\[\[screenId=([^\]]+)\]\]\s*$/i;

export interface ParsedFeedbackLine {
  rawText: string;
  text: string;
  body: string;
  screenId: string | null;
  originalScreenNumber: number | null;
  hasEmbeddedScreenId: boolean;
  unresolved: boolean;
}

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
  return text
    .replace(/\s*\n+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getEmbeddedScreenId(text: string) {
  return text.match(SCREEN_ID_TOKEN_REGEX)?.[1] ?? null;
}

function stripScreenIdToken(text: string) {
  return text.replace(SCREEN_ID_TOKEN_REGEX, "").trim();
}

function getSortedScreens(screens: FrameData[]) {
  return [...screens].sort((a, b) => a.timestamp - b.timestamp);
}

function getScreenNumberById(screenId: string, screens: FrameData[]) {
  const index = getSortedScreens(screens).findIndex(
    (screen) => screen.id === screenId,
  );
  return index >= 0 ? index + 1 : null;
}

function buildScreenScopedText(body: string, screenNumber: number) {
  const normalizedBody = normalizeSerializedText(body);
  return normalizedBody
    ? `Screen ${screenNumber}: ${normalizedBody}`
    : `Screen ${screenNumber}`;
}

function buildUnresolvedScreenText(screenNumber: number, body: string) {
  const normalizedBody = normalizeSerializedText(body);
  return normalizedBody
    ? `Original Screen ${screenNumber}: ${normalizedBody}`
    : `Original Screen ${screenNumber}`;
}

function ensureScreenPrefix(text: string, screenNumber: number) {
  const normalizedText = normalizeSerializedText(normalizeFeedbackLine(text));
  if (/^Screen \d+:/i.test(normalizedText)) {
    return normalizedText;
  }

  return `Screen ${screenNumber}: ${normalizedText}`;
}

function ensureScreenToken(text: string, screenId: string) {
  const withoutToken = stripScreenIdToken(text);
  return `${withoutToken} [[screenId=${screenId}]]`;
}

export function parseFeedbackLine({
  text,
  screens,
}: {
  text: string;
  screens: FrameData[];
}): ParsedFeedbackLine {
  const rawText = text;
  const normalizedLine = normalizeFeedbackLine(text);
  const embeddedScreenId = getEmbeddedScreenId(normalizedLine);
  const withoutToken = stripScreenIdToken(normalizedLine);
  const screenMatch = withoutToken.match(SCREEN_LINE_REGEX);
  const sortedScreens = getSortedScreens(screens);

  if (embeddedScreenId) {
    const currentScreenNumber = getScreenNumberById(
      embeddedScreenId,
      sortedScreens,
    );
    const body = screenMatch ? screenMatch[2] : withoutToken;

    if (currentScreenNumber) {
      return {
        rawText,
        text: buildScreenScopedText(body, currentScreenNumber),
        body: normalizeSerializedText(body),
        screenId: embeddedScreenId,
        originalScreenNumber: screenMatch
          ? Number.parseInt(screenMatch[1], 10)
          : currentScreenNumber,
        hasEmbeddedScreenId: true,
        unresolved: false,
      };
    }

    return {
      rawText,
      text: withoutToken,
      body: screenMatch
        ? normalizeSerializedText(screenMatch[2])
        : normalizeSerializedText(withoutToken),
      screenId: embeddedScreenId,
      originalScreenNumber: screenMatch
        ? Number.parseInt(screenMatch[1], 10)
        : null,
      hasEmbeddedScreenId: true,
      unresolved: true,
    };
  }

  if (!screenMatch) {
    return {
      rawText,
      text: withoutToken,
      body: normalizeSerializedText(withoutToken),
      screenId: null,
      originalScreenNumber: null,
      hasEmbeddedScreenId: false,
      unresolved: false,
    };
  }

  const originalScreenNumber = Number.parseInt(screenMatch[1], 10);
  const body = screenMatch[2];
  const mappedScreen = sortedScreens[originalScreenNumber - 1];
  if (!mappedScreen) {
    return {
      rawText,
      text: buildUnresolvedScreenText(originalScreenNumber, body),
      body: normalizeSerializedText(body),
      screenId: null,
      originalScreenNumber,
      hasEmbeddedScreenId: false,
      unresolved: true,
    };
  }

  return {
    rawText,
    text: buildScreenScopedText(body, originalScreenNumber),
    body: normalizeSerializedText(body),
    screenId: mappedScreen.id,
    originalScreenNumber,
    hasEmbeddedScreenId: false,
    unresolved: false,
  };
}

export function parseFeedbackChecklistItems({
  text,
  screens,
}: {
  text?: string | null;
  screens: FrameData[];
}) {
  return getFeedbackLines(text).map((line) =>
    parseFeedbackLine({
      text: line,
      screens,
    }),
  );
}

export function upgradeLegacyFeedbackText({
  text,
  screens,
}: {
  text?: string | null;
  screens: FrameData[];
}) {
  if (!text) {
    return { text: text ?? "", changed: false };
  }

  let changed = false;
  const upgradedLines = getFeedbackLines(text).map((line) => {
    const parsed = parseFeedbackLine({ text: line, screens });
    if (
      parsed.screenId &&
      parsed.originalScreenNumber !== null &&
      !parsed.hasEmbeddedScreenId &&
      !parsed.unresolved
    ) {
      changed = true;
      return ensureScreenToken(
        buildScreenScopedText(parsed.body, parsed.originalScreenNumber),
        parsed.screenId,
      );
    }

    return normalizeFeedbackLine(line);
  });

  return {
    text: upgradedLines.join("\n"),
    changed,
  };
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
  const sortedScreens = getSortedScreens(screens);

  // Group screen-scoped lines by body text so that multi-screen comments
  // (serialized as one line per screen) are re-assembled as a single imported
  // comment with screenIds — matching their pre-serialization shape and
  // collapsing correctly in the All Issues view via dedupeComments.
  const screenGroups = new Map<string, { screenIds: string[]; body: string }>();

  getFeedbackLines(text).forEach((line) => {
    const parsed = parseFeedbackLine({ text: line, screens: sortedScreens });

    if (!parsed.screenId || parsed.unresolved) {
      flowComments.push(
        createImportedComment({ text: parsed.text, destination }),
      );
      return;
    }

    const groupKey = parsed.body.toLowerCase();
    const existing = screenGroups.get(groupKey);
    if (existing) {
      existing.screenIds.push(parsed.screenId);
    } else {
      screenGroups.set(groupKey, {
        screenIds: [parsed.screenId],
        body: parsed.body,
      });
    }
  });

  screenGroups.forEach(({ screenIds, body }) => {
    const comment: ReviewComment = {
      id: crypto.randomUUID(),
      text: body,
      destination,
      imported: true,
      screenIds: screenIds.length > 1 ? screenIds : undefined,
    };
    screenIds.forEach((screenId) => {
      commentsByScreen[screenId] = [
        ...(commentsByScreen[screenId] ?? []),
        comment,
      ];
    });
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

  const serializedScreenCommentIds = new Set<string>();

  sortedScreens.forEach((screen, index) => {
    const screenComments = feedbackState.commentsByScreen[screen.id] ?? [];
    screenComments.forEach((comment) => {
      if (!comment.destination) {
        return;
      }

      if (serializedScreenCommentIds.has(comment.id)) {
        return;
      }
      serializedScreenCommentIds.add(comment.id);

      const targetScreenIds =
        comment.screenIds && comment.screenIds.length > 0
          ? comment.screenIds
          : [screen.id];

      targetScreenIds.forEach((screenId) => {
        const targetIndex = sortedScreens.findIndex(
          (candidate) => candidate.id === screenId,
        );
        if (targetIndex < 0) {
          return;
        }

        const serializedLine = ensureScreenToken(
          ensureScreenPrefix(comment.text, targetIndex + 1),
          screenId,
        );
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
