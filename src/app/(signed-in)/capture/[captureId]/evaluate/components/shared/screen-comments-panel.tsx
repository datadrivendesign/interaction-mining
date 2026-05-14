"use client";

import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { CommentCard } from "./screen-comments/comment-card";
import { CommentComposer } from "./screen-comments/comment-composer";
import { CommentSection } from "./screen-comments/comment-section";
import {
  fillIssueTemplate,
  getTemplatePlaceholders,
  ReviewCommentTarget,
} from "./screen-comments/comment-utils";
import { ReviewCommentHotkeyAction } from "./use-review-comment-hotkeys";
import { ButtonGroup } from "@/components/ui/button-group";

export type ScreenComment = ReviewComment;

export function ScreenCommentsPanel({
  screens,
  activeScreenId,
  feedbackState,
  onFeedbackStateChange,
  hotkeyAction,
  onJumpToScreen,
}: {
  screens: FrameData[];
  activeScreenId: string | null;
  feedbackState?: ReviewFeedbackState;
  onFeedbackStateChange?: (feedback: ReviewFeedbackState) => void;
  hotkeyAction?: ReviewCommentHotkeyAction | null;
  onJumpToScreen?: (screenId: string) => void;
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
  const [viewMode, setViewMode] = useState<"focused" | "all">("focused");
  const lastProcessedHotkeyActionRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
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
  const screenMetaById = useMemo(
    () =>
      Object.fromEntries(
        sortedScreens.map((screen, index) => [
          screen.id,
          {
            screen,
            screenNumber: index + 1,
            screenLabel: `Screen ${index + 1}`,
          },
        ]),
      ) as Record<
        string,
        { screen: FrameData; screenNumber: number; screenLabel: string }
      >,
    [sortedScreens],
  );
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
  const allComments = useMemo(
    () => [
      ...flowComments,
      ...Object.values(resolvedFeedbackState.commentsByScreen).flat(),
    ],
    [flowComments, resolvedFeedbackState.commentsByScreen],
  );
  const usedIssueIds = useMemo(
    () =>
      Array.from(
        new Set(
          allComments
            .map((comment) => comment.issueId)
            .filter((issueId): issueId is string => Boolean(issueId)),
        ),
      ),
    [allComments],
  );
  const recentIssueIds = useMemo(() => {
    const seen = new Set<string>();
    const orderedIssueIds = [...allComments]
      .slice()
      .reverse()
      .map((comment) => comment.issueId)
      .filter((issueId): issueId is string => Boolean(issueId))
      .filter((issueId) => {
        if (seen.has(issueId)) {
          return false;
        }
        seen.add(issueId);
        return true;
      });

    return orderedIssueIds;
  }, [allComments]);
  const allIssueEntries = useMemo(
    () => [
      ...flowComments.map((comment) => ({
        comment,
        target: "flow" as const,
        screenId: null,
        screenLabel: "Flow",
      })),
      ...sortedScreens.flatMap((screen, index) =>
        (resolvedFeedbackState.commentsByScreen[screen.id] ?? []).map(
          (comment) => ({
            comment,
            target: "screen" as const,
            screenId: screen.id,
            screenLabel: `Screen ${index + 1}`,
          }),
        ),
      ),
    ],
    [flowComments, resolvedFeedbackState.commentsByScreen, sortedScreens],
  );
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

  useEffect(() => {
    if (!pendingIssue && !showTextarea) {
      return;
    }

    composerRef.current?.scrollIntoView({
      block: "nearest",
    });
  }, [pendingIssue, showTextarea]);

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
    (target: "screen" | "flow", id: string, screenId?: string | null) => {
      setFeedbackState((prev) => {
        if (target === "flow") {
          return {
            ...prev,
            flowComments: prev.flowComments.filter(
              (comment) => comment.id !== id,
            ),
          };
        }

        const targetScreenId = screenId ?? activeScreen?.id;
        if (!targetScreenId) {
          return prev;
        }

        return {
          ...prev,
          commentsByScreen: {
            ...prev.commentsByScreen,
            [targetScreenId]: (
              prev.commentsByScreen[targetScreenId] ?? []
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
    (
      target: "screen" | "flow",
      id: string,
      text: string,
      screenId?: string | null,
    ) => {
      setFeedbackState((prev) => {
        if (target === "flow") {
          return {
            ...prev,
            flowComments: prev.flowComments.map((comment) =>
              comment.id === id ? { ...comment, text } : comment,
            ),
          };
        }

        const targetScreenId = screenId ?? activeScreen?.id;
        if (!targetScreenId) {
          return prev;
        }

        return {
          ...prev,
          commentsByScreen: {
            ...prev.commentsByScreen,
            [targetScreenId]: (prev.commentsByScreen[targetScreenId] ?? []).map(
              (comment) => (comment.id === id ? { ...comment, text } : comment),
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

  const handleJumpToScreen = useCallback(
    (screenId: string) => {
      setViewMode("focused");
      onJumpToScreen?.(screenId);
    },
    [onJumpToScreen],
  );

  const renderCommentCard = ({
    comment,
    target,
    screenId,
    screenLabelOverride,
    showJumpAction = false,
  }: {
    comment: ReviewComment;
    target: ReviewCommentTarget;
    screenId?: string | null;
    screenLabelOverride?: string;
    showJumpAction?: boolean;
  }) => {
    const commentKey = `${target}:${comment.id}`;
    const screenMeta =
      screenId && screenId in screenMetaById ? screenMetaById[screenId] : null;
    const screenLabelForComment =
      screenLabelOverride ?? screenMeta?.screenLabel ?? "Screen";

    return (
      <CommentCard
        key={comment.id}
        comment={comment}
        target={target}
        isExpanded={expandedCommentId === commentKey}
        onToggleExpanded={() =>
          setExpandedCommentId((prev) =>
            prev === commentKey ? null : commentKey,
          )
        }
        onRemove={() => removeComment(target, comment.id, screenId)}
        onUpdateText={(text) =>
          updateComment(target, comment.id, text, screenId)
        }
        screenLabel={
          target === "screen" && screenId ? screenLabelForComment : undefined
        }
        showJumpAction={showJumpAction}
        onJumpToScreen={
          showJumpAction && target === "screen" && screenId
            ? () => handleJumpToScreen(screenId)
            : undefined
        }
      />
    );
  };

  const renderCommentSection = ({
    title,
    comments,
    target,
    emptyMessage,
  }: {
    title: string;
    comments: ReviewComment[];
    target: ReviewCommentTarget;
    emptyMessage: string;
  }) => (
    <CommentSection
      title={title}
      count={comments.length}
      emptyMessage={emptyMessage}
    >
      {comments.map((comment) =>
        renderCommentCard({
          comment,
          target,
          screenId: target === "screen" ? (activeScreen?.id ?? null) : null,
        }),
      )}
    </CommentSection>
  );

  const panelIssueCount =
    viewMode === "all" ? allComments.length : screenComments.length;

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-neutral-200 px-3 dark:border-neutral-800">
        <MessageSquare className="size-3 shrink-0 text-red-500 dark:text-red-400" />
        <span className="flex-1 truncate text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          {viewMode === "all" ? "All Issues" : screenLabel}
        </span>
        {panelIssueCount > 0 && (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-mono text-[10px] leading-none text-red-600 dark:bg-red-950 dark:text-red-400">
            {panelIssueCount}
          </span>
        )}
        <div className="ml-1 flex items-center gap-1">
          <ButtonGroup>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "focused" ? "default" : "outline"}
              className="h-6 px-2 text-[12px] cursor-pointer hover:"
              onClick={() => setViewMode("focused")}
            >
              Focused
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "all" ? "default" : "outline"}
              className="h-6 px-2 text-[12px] cursor-pointer"
              onClick={() => setViewMode("all")}
            >
              All issues
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 max-h-[48%] flex-none flex-col overflow-y-auto overscroll-contain border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col gap-2.5 p-3">
            <p className="text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
              Add all review feedback here. Click a chip to flag an issue
              immediately, or pick{" "}
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                Other...
              </span>{" "}
              to write a custom note.
            </p>
            <CommentComposer
              composerRef={composerRef}
              textareaRef={textareaRef}
              pendingIssue={pendingIssue}
              pendingPlaceholders={pendingPlaceholders}
              placeholderValues={placeholderValues}
              pendingPreview={pendingPreview}
              showTextarea={showTextarea}
              customDestination={customDestination}
              draft={draft}
              screenLabel={screenLabel}
              hasActiveScreen={!!activeScreen}
              onPlaceholderValueChange={handlePlaceholderValueChange}
              onPlaceholderKeyDown={handlePlaceholderKeyDown}
              onAddPendingIssue={() =>
                pendingIssue &&
                addComment({
                  text: pendingPreview,
                  issueId: pendingIssue.id,
                  destination: pendingIssue.destination,
                  target: pendingIssue.scope,
                })
              }
              onResetComposer={resetComposer}
              onSetCustomDestination={setCustomDestination}
              onDraftChange={setDraft}
              onDraftKeyDown={handleKeyDown}
              onAddCustomIssue={() =>
                addComment({
                  text: draft,
                  destination: customDestination,
                  target: customDestination === "summarize" ? "flow" : "screen",
                })
              }
            />

            <div className="pr-1">
              <IssueGrid
                onSelectIssue={handleIssueSelect}
                onSelectOther={handleOtherSelect}
                disableScreenIssues={!activeScreen}
                selectedIssueId={pendingIssue?.id ?? null}
                usedIssueIds={usedIssueIds}
                recentIssueIds={recentIssueIds}
              />
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {viewMode === "all" ? (
            allIssueEntries.length === 0 ? (
              <p className="px-3 py-3 text-[10px] text-neutral-400 dark:text-neutral-600">
                No review feedback added yet.
              </p>
            ) : (
              <div className="space-y-1 px-2 py-2">
                {allIssueEntries.map((entry) =>
                  renderCommentCard({
                    comment: entry.comment,
                    target: entry.target,
                    screenId: entry.screenId,
                    screenLabelOverride: entry.screenLabel,
                    showJumpAction: entry.target === "screen",
                  }),
                )}
              </div>
            )
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
