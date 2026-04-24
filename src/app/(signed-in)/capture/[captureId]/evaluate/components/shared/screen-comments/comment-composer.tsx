"use client";

import { KeyboardEvent, MutableRefObject } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TraceIssue, TraceIssueDestination } from "../trace-issues";
import { formatPlaceholderLabel } from "./comment-utils";

export function CommentComposer({
  composerRef,
  textareaRef,
  pendingIssue,
  pendingPlaceholders,
  placeholderValues,
  pendingPreview,
  showTextarea,
  customDestination,
  draft,
  screenLabel,
  hasActiveScreen,
  onPlaceholderValueChange,
  onPlaceholderKeyDown,
  onAddPendingIssue,
  onResetComposer,
  onSetCustomDestination,
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
  draft: string;
  screenLabel: string;
  hasActiveScreen: boolean;
  onPlaceholderValueChange: (token: string, value: string) => void;
  onPlaceholderKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onAddPendingIssue: () => void;
  onResetComposer: () => void;
  onSetCustomDestination: (destination: TraceIssueDestination) => void;
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
      className="space-y-2 rounded-lg border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-neutral-900"
    >
      {pendingIssue && (
        <>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600 dark:text-red-300">
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
                <label className="text-[10px] font-medium uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
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
              onClick={onAddPendingIssue}
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
            <p className="text-[10px] font-semibold uppercase tracking-widest text-red-600 dark:text-red-300">
              Add custom issue
            </p>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              {customDestination === "summarize"
                ? "This note will be saved as flow-level summarize feedback."
                : `This note will be saved under ${screenLabel}.`}
            </p>
          </div>
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
                onClick={() => onSetCustomDestination(destination)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Textarea
            ref={textareaRef}
            className="h-14 min-h-0 resize-none text-xs"
            placeholder="Describe the issue... (Enter to add)"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={onDraftKeyDown}
            disabled={!hasActiveScreen && customDestination !== "summarize"}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={onAddCustomIssue}
              disabled={
                !draft.trim() ||
                (!hasActiveScreen && customDestination !== "summarize")
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
