"use client";

import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FrameData } from "../../../edit/components/types";
import {
  EMPTY_REVIEW_FEEDBACK_STATE,
  ReviewComment,
  ReviewFeedbackState,
} from "../../utils/review-feedback";
import {
  findTraceIssue,
  TraceIssue,
  TraceIssueDestination,
} from "./trace-issues";
import { IssueGrid } from "./issue-grid";

const SCREEN_NUMBER_TOKEN = /Screen #/g;
const PLACEHOLDER_TOKEN = /\[([^\]]+)\]/g;

function getTemplatePlaceholders(template: string) {
  return Array.from(
    new Set(
      Array.from(template.matchAll(PLACEHOLDER_TOKEN), (match) => match[1]),
    ),
  );
}

function fillIssueTemplate(
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

function formatPlaceholderLabel(token: string) {
  return token
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export type ScreenComment = ReviewComment;

export type ScreenCommentsHotkeyAction =
  | {
      nonce: number;
      type: "select-issue";
      issueId: string;
    }
  | {
      nonce: number;
      type: "select-other";
    }
  | {
      nonce: number;
      type: "remove-last-screen-comment";
    };

export function ScreenCommentsPanel({
  screens,
  activeScreenId,
  feedbackState,
  onFeedbackStateChange,
  hotkeyAction,
}: {
  screens: FrameData[];
  activeScreenId: string | null;
  feedbackState?: ReviewFeedbackState;
  onFeedbackStateChange?: (feedback: ReviewFeedbackState) => void;
  hotkeyAction?: ScreenCommentsHotkeyAction | null;
}) {
  const [internalFeedbackState, setInternalFeedbackState] =
    useState<ReviewFeedbackState>(EMPTY_REVIEW_FEEDBACK_STATE);
  const [draft, setDraft] = useState("");
  const [showTextarea, setShowTextarea] = useState(false);
  const [customDestination, setCustomDestination] =
    useState<TraceIssueDestination>("annotation");
  const [pendingIssue, setPendingIssue] = useState<TraceIssue | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<
    Record<string, string>
  >({});
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(
    null,
  );
  const lastProcessedHotkeyActionRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resolvedFeedbackState = feedbackState ?? internalFeedbackState;

  const setFeedbackState = useCallback(
    (
      nextFeedback:
        | ReviewFeedbackState
        | ((prev: ReviewFeedbackState) => ReviewFeedbackState),
    ) => {
      const updatedFeedback =
        typeof nextFeedback === "function"
          ? nextFeedback(resolvedFeedbackState)
          : nextFeedback;

      if (onFeedbackStateChange) {
        onFeedbackStateChange(updatedFeedback);
        return;
      }

      setInternalFeedbackState(updatedFeedback);
    },
    [onFeedbackStateChange, resolvedFeedbackState],
  );

  const sortedScreens = [...screens].sort((a, b) => a.timestamp - b.timestamp);
  const activeScreen =
    sortedScreens.find((screen) => screen.id === activeScreenId) ??
    sortedScreens[0] ??
    null;
  const activeIndex = activeScreen ? sortedScreens.indexOf(activeScreen) : -1;
  const screenNumber = activeIndex + 1;
  const screenLabel = activeScreen
    ? `Screen ${screenNumber}`
    : "No screen selected";
  const screenComments = useMemo(
    () =>
      activeScreen
        ? (resolvedFeedbackState.commentsByScreen[activeScreen.id] ?? [])
        : [],
    [activeScreen, resolvedFeedbackState.commentsByScreen],
  );
  const flowComments = resolvedFeedbackState.flowComments;
  const pendingPlaceholders = pendingIssue
    ? getTemplatePlaceholders(pendingIssue.annotation)
    : [];
  const pendingPreview = pendingIssue
    ? fillIssueTemplate(
        pendingIssue.annotation,
        screenNumber,
        placeholderValues,
      )
    : "";

  const resetComposer = useCallback(() => {
    setDraft("");
    setShowTextarea(false);
    setCustomDestination("annotation");
    setPendingIssue(null);
    setPlaceholderValues({});
  }, []);

  const addComment = useCallback(
    ({
      text,
      issueId,
      destination,
      target,
    }: {
      text: string;
      issueId?: string;
      destination?: TraceIssueDestination;
      target: "screen" | "flow";
    }) => {
      if (!text.trim() || !destination) {
        return;
      }

      const nextComment: ReviewComment = {
        id: crypto.randomUUID(),
        text: text.trim(),
        issueId,
        destination,
      };

      setFeedbackState((prev) => {
        if (target === "flow") {
          return {
            ...prev,
            flowComments: [...prev.flowComments, nextComment],
          };
        }

        if (!activeScreen) {
          return prev;
        }

        return {
          ...prev,
          commentsByScreen: {
            ...prev.commentsByScreen,
            [activeScreen.id]: [
              ...(prev.commentsByScreen[activeScreen.id] ?? []),
              nextComment,
            ],
          },
        };
      });

      resetComposer();
      setExpandedCommentId(`${target}:${nextComment.id}`);
    },
    [activeScreen, resetComposer, setFeedbackState],
  );

  const removeComment = useCallback(
    (target: "screen" | "flow", id: string) => {
      setFeedbackState((prev) => {
        if (target === "flow") {
          return {
            ...prev,
            flowComments: prev.flowComments.filter(
              (comment) => comment.id !== id,
            ),
          };
        }

        if (!activeScreen) {
          return prev;
        }

        return {
          ...prev,
          commentsByScreen: {
            ...prev.commentsByScreen,
            [activeScreen.id]: (
              prev.commentsByScreen[activeScreen.id] ?? []
            ).filter((comment) => comment.id !== id),
          },
        };
      });

      if (expandedCommentId === `${target}:${id}`) {
        setExpandedCommentId(null);
      }
    },
    [activeScreen, expandedCommentId, setFeedbackState],
  );

  const updateComment = useCallback(
    (target: "screen" | "flow", id: string, text: string) => {
      setFeedbackState((prev) => {
        if (target === "flow") {
          return {
            ...prev,
            flowComments: prev.flowComments.map((comment) =>
              comment.id === id ? { ...comment, text } : comment,
            ),
          };
        }

        if (!activeScreen) {
          return prev;
        }

        return {
          ...prev,
          commentsByScreen: {
            ...prev.commentsByScreen,
            [activeScreen.id]: (
              prev.commentsByScreen[activeScreen.id] ?? []
            ).map((comment) =>
              comment.id === id ? { ...comment, text } : comment,
            ),
          },
        };
      });
    },
    [activeScreen, setFeedbackState],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      addComment({
        text: draft,
        destination: customDestination,
        target: customDestination === "summarize" ? "flow" : "screen",
      });
    }
    if (event.key === "Escape") {
      resetComposer();
    }
  };

  const handleIssueSelect = useCallback(
    (issue: TraceIssue) => {
      if (issue.scope === "screen" && !activeScreen) {
        return;
      }

      const placeholders = getTemplatePlaceholders(issue.annotation);
      if (placeholders.length > 0) {
        setPendingIssue(issue);
        setShowTextarea(false);
        setPlaceholderValues(
          placeholders.reduce<Record<string, string>>((acc, token) => {
            acc[token] = "";
            return acc;
          }, {}),
        );
        return;
      }

      addComment({
        text: fillIssueTemplate(issue.annotation, screenNumber),
        issueId: issue.id,
        destination: issue.destination,
        target: issue.scope,
      });
    },
    [activeScreen, addComment, screenNumber],
  );

  const handleOtherSelect = useCallback(() => {
    setPendingIssue(null);
    setPlaceholderValues({});
    setDraft("");
    setCustomDestination("annotation");
    setShowTextarea(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, []);

  const handlePlaceholderValueChange = (token: string, value: string) => {
    setPlaceholderValues((prev) => ({
      ...prev,
      [token]: value,
    }));
  };

  const handlePlaceholderKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || !pendingIssue) {
      return;
    }

    const hasMissingValues = pendingPlaceholders.some(
      (token) => !placeholderValues[token]?.trim(),
    );
    if (hasMissingValues) {
      return;
    }

    event.preventDefault();
    addComment({
      text: pendingPreview,
      issueId: pendingIssue.id,
      destination: pendingIssue.destination,
      target: pendingIssue.scope,
    });
  };

  useEffect(() => {
    if (!hotkeyAction) {
      return;
    }
    if (lastProcessedHotkeyActionRef.current === hotkeyAction.nonce) {
      return;
    }
    lastProcessedHotkeyActionRef.current = hotkeyAction.nonce;

    if (hotkeyAction.type === "select-other") {
      handleOtherSelect();
      return;
    }

    if (hotkeyAction.type === "remove-last-screen-comment") {
      const lastComment = screenComments.at(-1);
      if (lastComment) {
        removeComment("screen", lastComment.id);
      }
      return;
    }

    const selectedIssue = findTraceIssue(hotkeyAction.issueId);
    if (selectedIssue) {
      handleIssueSelect(selectedIssue);
    }
  }, [
    handleIssueSelect,
    handleOtherSelect,
    hotkeyAction,
    removeComment,
    screenComments,
  ]);

  const getCommentLabel = (comment: ReviewComment) => {
    return findTraceIssue(comment.issueId ?? "")?.label ?? "Custom issue";
  };

  const getDestinationLabel = (destination?: TraceIssueDestination) => {
    if (destination === "redaction") return "Redaction";
    if (destination === "summarize") return "Summarize";
    return "Annotation";
  };

  const renderCommentSection = ({
    title,
    comments,
    target,
    emptyMessage,
  }: {
    title: string;
    comments: ReviewComment[];
    target: "screen" | "flow";
    emptyMessage: string;
  }) => (
    <div className="border-t border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          {title}
        </span>
        {comments.length > 0 && (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-mono text-[10px] leading-none text-red-600 dark:bg-red-950 dark:text-red-400">
            {comments.length}
          </span>
        )}
      </div>

      {comments.length === 0 ? (
        <p className="px-3 pb-3 text-[10px] text-neutral-400 dark:text-neutral-600">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-1 px-2 pb-2">
          {comments.map((comment) => {
            const commentKey = `${target}:${comment.id}`;

            return (
              <div
                key={comment.id}
                className="rounded border border-transparent bg-white/70 transition-colors dark:bg-neutral-900/60"
              >
                <div className="flex items-start gap-1 p-1.5">
                  <button
                    type="button"
                    className="flex flex-1 items-start gap-1.5 text-left"
                    onClick={() =>
                      setExpandedCommentId((prev) =>
                        prev === commentKey ? null : commentKey,
                      )
                    }
                  >
                    {expandedCommentId === commentKey ? (
                      <ChevronDown className="mt-0.5 size-3 shrink-0 text-neutral-400" />
                    ) : (
                      <ChevronRight className="mt-0.5 size-3 shrink-0 text-neutral-400" />
                    )}
                    <AlertCircle className="mt-0.5 size-3 shrink-0 text-red-400" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-200">
                          {getCommentLabel(comment)}
                        </span>
                        <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                          {getDestinationLabel(comment.destination)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-[11px] leading-snug text-neutral-600 dark:text-neutral-400">
                        {comment.text}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    className="shrink-0 p-1 text-neutral-400 transition-colors hover:text-red-500"
                    onClick={() => removeComment(target, comment.id)}
                  >
                    <X className="size-3" />
                  </button>
                </div>

                {expandedCommentId === commentKey && (
                  <div className="px-2 pb-2">
                    <Textarea
                      className="min-h-[5.5rem] resize-y text-xs"
                      value={comment.text}
                      onChange={(event) =>
                        updateComment(target, comment.id, event.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-neutral-200 px-3 dark:border-neutral-800">
        <MessageSquare className="size-3 shrink-0 text-red-500 dark:text-red-400" />
        <span className="flex-1 truncate text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          {screenLabel}
        </span>
        {screenComments.length > 0 && (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-mono text-[10px] leading-none text-red-600 dark:bg-red-950 dark:text-red-400">
            {screenComments.length}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 space-y-2.5 p-3">
          <p className="text-[10px] leading-snug text-neutral-500 dark:text-neutral-400">
            Add all review feedback here. Click a chip to flag an issue
            immediately, or pick{" "}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              Other...
            </span>{" "}
            to write a custom note.
          </p>
          <IssueGrid
            onSelectIssue={handleIssueSelect}
            onSelectOther={handleOtherSelect}
            disabled={!activeScreen}
          />

          {pendingIssue && (
            <div className="space-y-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-200">
                  {pendingIssue.label}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Fill in the required details before adding this issue.
                </p>
              </div>

              <div className="space-y-2">
                {pendingPlaceholders.map((token) => (
                  <div key={token} className="space-y-1">
                    <label className="text-[10px] font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {formatPlaceholderLabel(token)}
                    </label>
                    <Input
                      value={placeholderValues[token] ?? ""}
                      onChange={(event) =>
                        handlePlaceholderValueChange(token, event.target.value)
                      }
                      onKeyDown={handlePlaceholderKeyDown}
                      placeholder={`Enter ${formatPlaceholderLabel(token).toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  Preview
                </p>
                <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                  {pendingPreview}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() =>
                    addComment({
                      text: pendingPreview,
                      issueId: pendingIssue.id,
                      destination: pendingIssue.destination,
                      target: pendingIssue.scope,
                    })
                  }
                  disabled={pendingPlaceholders.some(
                    (token) => !placeholderValues[token]?.trim(),
                  )}
                >
                  <Plus className="mr-1 size-3" />
                  Add Issue
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  className="text-xs"
                  onClick={resetComposer}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showTextarea && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {(
                  [
                    ["annotation", "Annotate"],
                    ["redaction", "Redact"],
                    ["summarize", "Summarize"],
                  ] as const
                ).map(([destination, label]) => (
                  <Button
                    key={destination}
                    type="button"
                    size="sm"
                    variant={
                      customDestination === destination ? "default" : "outline"
                    }
                    className="flex-1 text-xs"
                    onClick={() => setCustomDestination(destination)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {customDestination === "summarize"
                  ? "This note will be saved as flow-level summarize feedback."
                  : `This note will be saved under ${screenLabel}.`}
              </p>
              <Textarea
                ref={textareaRef}
                className="h-14 min-h-0 resize-none text-xs"
                placeholder="Describe the issue... (Enter to add)"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!activeScreen && customDestination !== "summarize"}
              />
              <Button
                size="sm"
                className="h-7 w-full text-xs"
                onClick={() =>
                  addComment({
                    text: draft,
                    destination: customDestination,
                    target:
                      customDestination === "summarize" ? "flow" : "screen",
                  })
                }
                disabled={
                  !draft.trim() ||
                  (!activeScreen && customDestination !== "summarize")
                }
              >
                <Plus className="mr-1 size-3" />
                Add Issue
              </Button>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {renderCommentSection({
            title: "Flow Feedback",
            comments: flowComments,
            target: "flow",
            emptyMessage: "No flow-level feedback added yet.",
          })}
          {renderCommentSection({
            title: screenLabel,
            comments: screenComments,
            target: "screen",
            emptyMessage: `No screen-specific feedback added for ${screenLabel}.`,
          })}
        </div>
      </div>
    </aside>
  );
}
