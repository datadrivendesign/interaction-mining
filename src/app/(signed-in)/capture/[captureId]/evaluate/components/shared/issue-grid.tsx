"use client";

import { cn } from "@/lib/utils";
import {
  ISSUES_BY_CATEGORY,
  TRACE_ISSUE_CATEGORIES,
  TraceIssue,
  TraceIssueCategory,
} from "./trace-issues";

export function IssueGrid({
  onSelectIssue,
  onSelectOther,
  disabled = false,
}: {
  onSelectIssue: (issue: TraceIssue) => void;
  onSelectOther: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      {(Object.keys(ISSUES_BY_CATEGORY) as TraceIssueCategory[]).map(
        (category) => (
          <div key={category} className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              {TRACE_ISSUE_CATEGORIES[category]}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ISSUES_BY_CATEGORY[category].map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => onSelectIssue(issue)}
                  disabled={disabled}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-left text-[11px] leading-tight",
                    "border-neutral-300 bg-white text-neutral-700 transition-colors",
                    "hover:border-red-300 hover:bg-red-50 hover:text-red-700",
                    "dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
                    "dark:hover:border-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                  )}
                >
                  {issue.shortcutKey && (
                    <span className="inline-flex size-4 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                      {issue.shortcutKey}
                    </span>
                  )}
                  <span title={issue.label}>{issue.chipLabel ?? issue.label}</span>
                </button>
              ))}
            </div>
          </div>
        ),
      )}

      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          Custom
        </p>
        <button
          type="button"
          onClick={onSelectOther}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] leading-tight",
            "border-dashed border-neutral-300 bg-white text-neutral-700 transition-colors",
            "hover:border-red-300 hover:bg-red-50 hover:text-red-700",
            "dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
            "dark:hover:border-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100">
            O
          </span>
          <span>Other...</span>
        </button>
      </div>
    </div>
  );
}
