"use client";

import { AlertCircle, ChevronDown, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReviewComment } from "../../../utils/review-feedback";
import {
  getCommentLabel,
  getDestinationLabel,
  ReviewCommentTarget,
} from "./comment-utils";

export function CommentCard({
  comment,
  target,
  isExpanded,
  onToggleExpanded,
  onRemove,
  onUpdateText,
  screenLabel,
  showJumpAction = false,
  onJumpToScreen,
}: {
  comment: ReviewComment;
  target: ReviewCommentTarget;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onRemove: () => void;
  onUpdateText: (text: string) => void;
  screenLabel?: string;
  showJumpAction?: boolean;
  onJumpToScreen?: () => void;
}) {
  return (
    <div className="rounded border border-transparent bg-white/70 transition-colors dark:bg-neutral-900/60">
      <div className="flex items-start gap-1 p-1.5">
        <div className="flex min-w-0 flex-1 items-start gap-1.5">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-1.5 text-left cursor-pointer"
            onClick={onToggleExpanded}
          >
            {isExpanded ? (
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
                {!showJumpAction && target === "screen" && screenLabel && (
                  <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {screenLabel}
                  </span>
                )}
              </div>
              <p className="line-clamp-2 text-[11px] leading-snug text-neutral-600 dark:text-neutral-400">
                {comment.text}
              </p>
            </div>
          </button>
          {showJumpAction &&
            target === "screen" &&
            screenLabel &&
            onJumpToScreen && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 shrink-0 px-2 text-[10px] cursor-pointer hover:bg-blue-500/100 hover:text-white dark:hover:bg-blue-500/100 dark:hover:text-white"
                onClick={onJumpToScreen}
              >
                {screenLabel}
              </Button>
            )}
        </div>
        <button
          type="button"
          aria-label="Remove"
          className="shrink-0 p-1 text-neutral-400 transition-colors hover:text-red-500 cursor-pointer"
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </button>
      </div>

      {isExpanded && (
        <div className="px-2 pb-2">
          <Textarea
            className="min-h-[5.5rem] resize-y text-xs"
            value={comment.text}
            onChange={(event) => onUpdateText(event.target.value)}
          />
        </div>
      )}
    </div>
  );
}
