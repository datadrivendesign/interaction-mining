"use client";

import { KeyboardEvent, MutableRefObject } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FrameData } from "../../../../edit/components/types";
import { TraceIssue, TraceIssueDestination } from "../trace-issues";
import { formatPlaceholderLabel, ReviewCommentTarget } from "./comment-utils";

export function CommentComposer({
  composerRef,
  textareaRef,
  pendingIssue,
  pendingPlaceholders,
  placeholderValues,
  pendingPreview,
  showTextarea,
  customDestination,
  commentTarget,
  draft,
  screenLabel,
  hasActiveScreen,
  screens,
  selectedScreenIds,
  onPlaceholderValueChange,
  onPlaceholderKeyDown,
  onAddPendingIssue,
  onResetComposer,
  onSetCustomDestination,
  onSetCommentTarget,
  onSelectedScreenToggle,
  onDraftChange,
  onDraftKeyDown,
  onAddCustomIssue,
}: {
  composerRef: MutableRefObject<HTMLDivElement | null>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  pendingIssue: TraceIssue | null;
  pendingPlaceholders: string[];
  placeholderValues: Record<string, string>;
  pendingPreview: string;
  showTextarea: boolean;
  customDestination: TraceIssueDestination;
  commentTarget: ReviewCommentTarget;
  draft: string;
  screenLabel: string;
  hasActiveScreen: boolean;
  screens: FrameData[];
  selectedScreenIds: string[];
  onPlaceholderValueChange: (token: string, value: string) => void;
  onPlaceholderKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onAddPendingIssue: () => void;
  onResetComposer: () => void;
  onSetCustomDestination: (destination: TraceIssueDestination) => void;
  onSetCommentTarget: (target: ReviewCommentTarget) => void;
  onSelectedScreenToggle: (screenId: string, checked: boolean) => void;
  onDraftChange: (value: string) => void;
  onDraftKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onAddCustomIssue: () => void;
}) {
  if (!pendingIssue && !showTextarea) {
    return null;
  }

  return (
    <div
      ref={composerRef}
      className="space-y-1.5 rounded-lg border border-red-200 bg-white p-2 shadow-sm dark:border-red-900/60 dark:bg-neutral-900"
    >
      <FeedbackTargetControls
        customDestination={customDestination}
        commentTarget={commentTarget}
        screens={screens}
        selectedScreenIds={selectedScreenIds}
        hasActiveScreen={hasActiveScreen}
        onSetCustomDestination={onSetCustomDestination}
        onSetCommentTarget={onSetCommentTarget}
      />

      {pendingIssue && (
        <>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-widest text-red-600 uppercase dark:text-red-300">
              Complete selected issue
            </p>
            <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-200">
              {pendingIssue.label}
            </p>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Fill in the required details, then add the issue to the review.
            </p>
          </div>

          <div className="space-y-2">
            {pendingPlaceholders.map((token) => (
              <div key={token} className="space-y-1">
                <label className="text-[10px] font-medium tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                  {formatPlaceholderLabel(token)}
                </label>
                <Input
                  value={placeholderValues[token] ?? ""}
                  onChange={(event) =>
                    onPlaceholderValueChange(token, event.target.value)
                  }
                  onKeyDown={onPlaceholderKeyDown}
                  placeholder={`Enter ${formatPlaceholderLabel(token).toLowerCase()}...`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-medium tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
              Preview
            </p>
            <div className="max-h-24 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
              {pendingPreview}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 text-xs"
              onClick={onAddPendingIssue}
              disabled={
                pendingPlaceholders.some(
                  (token) => !placeholderValues[token]?.trim(),
                ) ||
                (commentTarget === "screen" && selectedScreenIds.length === 0)
              }
            >
              <Plus className="mr-1 size-3" />
              Add Issue
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              className="text-xs"
              onClick={onResetComposer}
            >
              Cancel
            </Button>
          </div>
        </>
      )}

      {showTextarea && (
        <>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold tracking-widest text-red-600 uppercase dark:text-red-300">
              Add custom issue
            </p>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {commentTarget === "flow"
                ? "This note will be saved as flow-level feedback."
                : selectedScreenIds.length > 1
                  ? `This note will be saved under ${selectedScreenIds.length} screens.`
                  : `This note will be saved under ${screenLabel}.`}
            </p>
          </div>
          <Textarea
            ref={textareaRef}
            className="h-12 min-h-0 resize-none text-xs"
            placeholder="Describe the issue... (Enter to add)"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onDraftKeyDown}
            disabled={
              commentTarget === "screen" && selectedScreenIds.length === 0
            }
          />
          {commentTarget === "screen" &&
            draft.trim() &&
            selectedScreenIds.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
                  Preview
                </p>
                <div className="max-h-24 overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                  {(() => {
                    const nums = selectedScreenIds
                      .map((id) => screens.findIndex((s) => s.id === id) + 1)
                      .filter((n) => n > 0)
                      .sort((a, b) => a - b);
                    const prefix =
                      nums.length > 1
                        ? `Screens ${nums.join(", ")}: `
                        : nums.length === 1
                          ? `Screen ${nums[0]}: `
                          : "";
                    return `${prefix}${draft.trim()}`;
                  })()}
                </div>
              </div>
            )}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={onAddCustomIssue}
              disabled={
                !draft.trim() ||
                (commentTarget === "screen" && selectedScreenIds.length === 0)
              }
            >
              <Plus className="mr-1 size-3" />
              Add Issue
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              className="text-xs"
              onClick={onResetComposer}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function FeedbackTargetControls({
  customDestination,
  commentTarget,
  screens,
  selectedScreenIds,
  hasActiveScreen,
  onSetCustomDestination,
  onSetCommentTarget,
}: {
  customDestination: TraceIssueDestination;
  commentTarget: ReviewCommentTarget;
  screens: FrameData[];
  selectedScreenIds: string[];
  hasActiveScreen: boolean;
  onSetCustomDestination: (destination: TraceIssueDestination) => void;
  onSetCommentTarget: (target: ReviewCommentTarget) => void;
}) {
  return (
    <div className="space-y-1.5 rounded-md border border-neutral-200 bg-neutral-50 p-1.5 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="space-y-1">
        <p className="text-[10px] font-medium tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
          Phase
        </p>
        <div className="grid w-full min-w-0 grid-cols-3 gap-1">
          {(
            [
              ["annotation", "Annotate"],
              ["redaction", "Redact"],
              ["summarize", "Description"],
            ] as const
          ).map(([destination, label]) => (
            <Button
              key={destination}
              type="button"
              size="sm"
              variant={
                customDestination === destination ? "default" : "outline"
              }
              title={label}
              className="h-7 w-full max-w-full min-w-0 justify-center gap-0 px-1 text-[9px] leading-tight whitespace-normal sm:text-[11px]"
              onClick={() => onSetCustomDestination(destination)}
            >
              <span className="block min-w-0 truncate">{label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-medium tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
          Scope
        </p>
        <div className="grid w-full min-w-0 grid-cols-2 gap-1">
          {(
            [
              ["screen", hasActiveScreen ? "Screen" : "No screen"],
              ["flow", "Flow"],
            ] as const
          ).map(([target, label]) => (
            <Button
              key={target}
              type="button"
              size="sm"
              variant={commentTarget === target ? "default" : "outline"}
              className="h-7 px-1 text-[10px] sm:text-[11px]"
              disabled={target === "screen" && !hasActiveScreen}
              onClick={() => onSetCommentTarget(target)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {commentTarget === "screen" &&
        hasActiveScreen &&
        selectedScreenIds.length > 1 && (
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
            Screens{" "}
            {selectedScreenIds
              .map(
                (screenId) => screens.findIndex((s) => s.id === screenId) + 1,
              )
              .filter((n) => n > 0)
              .sort((a, b) => a - b)
              .join(", ")}{" "}
            selected · use gallery to adjust
          </p>
        )}
    </div>
  );
}
