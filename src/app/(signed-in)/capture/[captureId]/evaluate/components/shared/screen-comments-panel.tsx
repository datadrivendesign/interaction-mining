"use client";

import { KeyboardEvent, useRef, useState } from "react";
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

export interface ScreenComment {
  id: string;
  text: string;
  issueId?: string;
  destination?: TraceIssueDestination;
}

export function ScreenCommentsPanel({
  screens,
  activeScreenId,
  commentsByScreen,
  onCommentsChange,
}: {
  screens: FrameData[];
  activeScreenId: string | null;
  commentsByScreen?: Record<string, ScreenComment[]>;
  onCommentsChange?: (comments: Record<string, ScreenComment[]>) => void;
}) {
  const [internalCommentsByScreen, setInternalCommentsByScreen] = useState<
    Record<string, ScreenComment[]>
  >({});
  const [draft, setDraft] = useState("");
  const [showTextarea, setShowTextarea] = useState(false);
  const [pendingIssue, setPendingIssue] = useState<TraceIssue | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<
    Record<string, string>
  >({});
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resolvedCommentsByScreen = commentsByScreen ?? internalCommentsByScreen;

  const setCommentsByScreen = (
    nextComments:
      | Record<string, ScreenComment[]>
      | ((
          prev: Record<string, ScreenComment[]>,
        ) => Record<string, ScreenComment[]>),
  ) => {
    const updatedComments =
      typeof nextComments === "function"
        ? nextComments(resolvedCommentsByScreen)
        : nextComments;

    if (onCommentsChange) {
      onCommentsChange(updatedComments);
      return;
    }

    setInternalCommentsByScreen(updatedComments);
  };

  const sortedScreens = [...screens].sort((a, b) => a.timestamp - b.timestamp);
  const activeScreen =
    sortedScreens.find((s) => s.id === activeScreenId) ??
    sortedScreens[0] ??
    null;
  const activeIndex = activeScreen ? sortedScreens.indexOf(activeScreen) : -1;
  const screenNumber = activeIndex + 1;
  const screenLabel = activeScreen
    ? `Screen ${screenNumber}`
    : "No screen selected";
  const comments = activeScreen
    ? (resolvedCommentsByScreen[activeScreen.id] ?? [])
    : [];
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

  const resetComposer = () => {
    setDraft("");
    setShowTextarea(false);
    setPendingIssue(null);
    setPlaceholderValues({});
  };

  const addComment = ({
    text,
    issueId,
    destination,
  }: {
    text: string;
    issueId?: string;
    destination?: TraceIssueDestination;
  }) => {
    if (!text.trim() || !activeScreen) return;
    const nextComment = {
      id: crypto.randomUUID(),
      text: text.trim(),
      issueId,
      destination,
    };

    setCommentsByScreen((prev) => ({
      ...prev,
      [activeScreen.id]: [...(prev[activeScreen.id] ?? []), nextComment],
    }));
    resetComposer();
    setExpandedCommentId(nextComment.id);
  };

  const removeComment = (id: string) => {
    if (!activeScreen) return;
    setCommentsByScreen((prev) => ({
      ...prev,
      [activeScreen.id]: (prev[activeScreen.id] ?? []).filter(
        (c) => c.id !== id,
      ),
    }));
    if (expandedCommentId === id) {
      setExpandedCommentId(null);
    }
  };

  const updateComment = (id: string, text: string) => {
    if (!activeScreen) return;
    setCommentsByScreen((prev) => ({
      ...prev,
      [activeScreen.id]: (prev[activeScreen.id] ?? []).map((comment) =>
        comment.id === id ? { ...comment, text } : comment,
      ),
    }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment({ text: draft });
    }
    if (e.key === "Escape") {
      resetComposer();
    }
  };

  const handleIssueSelect = (issue: TraceIssue) => {
    if (!activeScreen) return;
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
    });
  };

  const handleOtherSelect = () => {
    setPendingIssue(null);
    setPlaceholderValues({});
    setDraft("");
    setShowTextarea(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

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
    });
  };

  const getCommentLabel = (comment: ScreenComment) => {
    return findTraceIssue(comment.issueId ?? "")?.label ?? "Custom issue";
  };

  const getDestinationLabel = (destination?: TraceIssueDestination) => {
    if (destination === "redaction") return "Redaction";
    if (destination === "summarize") return "Summarize";
    return "Annotation";
  };

  return (
    <aside className="w-full h-full flex flex-col min-h-0 border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 h-9 border-b border-neutral-200 dark:border-neutral-800">
        <MessageSquare className="size-3 text-red-500 dark:text-red-400 shrink-0" />
        <span className="flex-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400 truncate">
          {screenLabel}
        </span>
        {comments.length > 0 && (
          <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full px-1.5 py-0.5 font-mono shrink-0 leading-none">
            {comments.length}
          </span>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Issue picker — the hero of this panel */}
        <div className="flex-shrink-0 p-3 space-y-2.5">
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-snug">
            Click a chip to flag an issue immediately. Pick{" "}
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
                    })
                  }
                  disabled={pendingPlaceholders.some(
                    (token) => !placeholderValues[token]?.trim(),
                  )}
                >
                  <Plus className="size-3 mr-1" />
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
            <>
              <Textarea
                ref={textareaRef}
                className="h-14 min-h-0 resize-none text-xs"
                placeholder="Describe the issue... (Enter to add)"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!activeScreen}
              />
              <Button
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => addComment({ text: draft })}
                disabled={!draft.trim() || !activeScreen}
              >
                <Plus className="size-3 mr-1" />
                Add Issue
              </Button>
            </>
          )}
        </div>

        {/* ── Comments list — compact rows ── */}
        {comments.length > 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto border-t border-neutral-200 dark:border-neutral-800">
            <div className="p-2 space-y-1">
              {comments.map((comment) => (
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
                          prev === comment.id ? null : comment.id,
                        )
                      }
                    >
                      {expandedCommentId === comment.id ? (
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
                      onClick={() => removeComment(comment.id)}
                      className="shrink-0 p-1 text-neutral-400 transition-colors hover:text-red-500"
                      aria-label="Remove"
                      type="button"
                    >
                      <X className="size-3" />
                    </button>
                  </div>

                  {expandedCommentId === comment.id && (
                    <div className="px-2 pb-2">
                      <Textarea
                        className="min-h-[5.5rem] resize-y text-xs"
                        value={comment.text}
                        onChange={(e) =>
                          updateComment(comment.id, e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {comments.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] text-neutral-400 dark:text-neutral-600 text-center px-4">
              No issues flagged for {screenLabel}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
