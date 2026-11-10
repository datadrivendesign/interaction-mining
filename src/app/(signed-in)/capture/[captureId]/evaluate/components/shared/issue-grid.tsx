"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, Clock3, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  findTraceIssue,
  ISSUES_BY_CATEGORY,
  TRACE_ISSUE_CATEGORIES,
  TraceIssue,
  TraceIssueCategory,
  TraceIssueScope,
} from "./trace-issues";
import {
  CHECKLIST_STEPS,
  ChecklistMark,
  ReviewChecklist,
} from "./review-checklist";

function matchesIssueSearch(issue: TraceIssue, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    issue.label,
    issue.chipLabel,
    issue.annotation,
    TRACE_ISSUE_CATEGORIES[issue.category].label,
    TRACE_ISSUE_CATEGORIES[issue.category].description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function IssueGrid({
  onSelectIssue,
  onSelectOther,
  disableScreenIssues = false,
  selectedIssueId = null,
  usedIssueIds = [],
  recentIssueIds = [],
  checklist,
  onChecklistMark,
  onPassAll,
}: {
  onSelectIssue: (issue: TraceIssue) => void;
  onSelectOther: () => void;
  disableScreenIssues?: boolean;
  selectedIssueId?: string | null;
  usedIssueIds?: string[];
  recentIssueIds?: string[];
  /** The reviewer's Pass/Issue marks; omit to hide the checklist controls. */
  checklist?: ReviewChecklist;
  onChecklistMark?: (category: TraceIssueCategory, mark: ChecklistMark) => void;
  onPassAll?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<
    Partial<Record<TraceIssueCategory, boolean>>
  >({});
  const normalizedQuery = query.trim().toLowerCase();
  const usedIssueIdSet = useMemo(() => new Set(usedIssueIds), [usedIssueIds]);

  const recentIssues = useMemo(
    () =>
      recentIssueIds
        .map((issueId) => findTraceIssue(issueId))
        .filter((issue): issue is TraceIssue => Boolean(issue))
        .slice(0, 5),
    [recentIssueIds],
  );

  const groupedIssues = useMemo(
    () =>
      CHECKLIST_STEPS.map((category) => ({
        category,
        issues: ISSUES_BY_CATEGORY[category].filter((issue) =>
          matchesIssueSearch(issue, normalizedQuery),
        ),
      })).filter((group) => group.issues.length > 0),
    [normalizedQuery],
  );

  const getScopedIssues = (issues: TraceIssue[], scope: TraceIssueScope) =>
    issues.filter((issue) => issue.scope === scope);

  const renderIssueChip = (issue: TraceIssue, compact = false) => {
    const isSelected = selectedIssueId === issue.id;
    const isUsed = usedIssueIdSet.has(issue.id);
    const isDisabled = disableScreenIssues && issue.scope === "screen";

    return (
      <button
        key={issue.id}
        type="button"
        onClick={() => onSelectIssue(issue)}
        disabled={isDisabled}
        aria-pressed={isSelected}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-left text-[13px] leading-tight transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isSelected
            ? "border-red-400 bg-red-100 text-red-700 shadow-sm dark:border-red-700 dark:bg-red-950/50 dark:text-red-200"
            : isUsed
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:border-emerald-700"
              : "border-neutral-300 bg-white text-neutral-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300",
        )}
      >
        {issue.shortcutKey && (
          <span
            className={cn(
              "inline-flex size-4 items-center justify-center rounded-full text-[11px] font-semibold",
              isSelected
                ? "bg-red-700 text-white dark:bg-red-200 dark:text-red-950"
                : "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
            )}
          >
            {issue.shortcutKey}
          </span>
        )}
        <span title={issue.label}>{issue.chipLabel ?? issue.label}</span>
        <span
          className={cn(
            "inline-flex rounded-full px-1 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
            issue.scope === "flow"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200"
              : "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200",
          )}
        >
          {issue.scope === "flow" ? "Flow" : "Screen"}
        </span>
        {isSelected && (
          <span className="inline-flex rounded-full bg-red-700 px-1 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase dark:bg-red-200 dark:text-red-950">
            Add details
          </span>
        )}
        {!compact && isUsed && !isSelected && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 uppercase dark:bg-emerald-900/60 dark:text-emerald-200">
            <Check className="size-2.5" />
            Used
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-neutral-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search issue chips..."
            className="h-8 pl-7 text-xs"
          />
        </div>

        {recentIssues.length > 0 && normalizedQuery.length === 0 && (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1 text-[11px] font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
              <Clock3 className="size-3" />
              Recently used
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recentIssues.map((issue) => renderIssueChip(issue, true))}
            </div>
          </div>
        )}
      </div>

      {checklist && onPassAll && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            Mark each step <span className="font-semibold">Pass</span> or{" "}
            <span className="font-semibold">Issue</span>.
          </p>
          <button
            type="button"
            onClick={onPassAll}
            className="shrink-0 cursor-pointer rounded-md border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-800 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200 dark:hover:bg-green-950/70"
            title="Mark every step Pass, except steps marked Issue"
          >
            {CHECKLIST_STEPS.some((step) => checklist[step] === "issue")
              ? "Pass the rest"
              : "Pass all"}
          </button>
        </div>
      )}

      {groupedIssues.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white/70 px-3 py-4 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400">
          No issue chips match “{query.trim()}”.
        </div>
      ) : (
        groupedIssues.map(({ category, issues }) => {
          const meta = TRACE_ISSUE_CATEGORIES[category];
          const mark = checklist?.[category];
          // A step marked Pass folds away unless the reviewer opens it or is
          // searching; unmarked and Issue steps show their chips.
          const isCollapsed = normalizedQuery
            ? false
            : (collapsedCategories[category] ?? mark === "pass");
          const screenIssues = getScopedIssues(issues, "screen");
          const flowIssues = getScopedIssues(issues, "flow");

          return (
            <div key={category} className="space-y-1.5">
              <div
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg border bg-white/80 px-2.5 py-2 transition-colors dark:bg-neutral-900/60",
                  mark === "pass"
                    ? "border-green-300 dark:border-green-800"
                    : mark === "issue"
                      ? "border-red-300 dark:border-red-800"
                      : "border-neutral-200 dark:border-neutral-800",
                )}
              >
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-left"
                  onClick={() =>
                    setCollapsedCategories((prev) => ({
                      ...prev,
                      [category]: !isCollapsed,
                    }))
                  }
                >
                  {isCollapsed ? (
                    <ChevronRight className="mt-0.5 size-3 shrink-0 text-neutral-400" />
                  ) : (
                    <ChevronDown className="mt-0.5 size-3 shrink-0 text-neutral-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold tracking-widest text-neutral-600 uppercase dark:text-neutral-300">
                        {meta.label}
                      </p>
                      <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {issues.length}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-snug text-neutral-500 dark:text-neutral-400">
                      {meta.description}
                    </p>
                  </div>
                </button>
                {checklist && onChecklistMark && (
                  <ChecklistMarkToggle
                    label={meta.label}
                    mark={mark}
                    onMark={(next) => onChecklistMark(category, next)}
                  />
                )}
              </div>

              {!isCollapsed && (
                <div className="space-y-2 pl-5">
                  {screenIssues.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium tracking-wider text-sky-700 uppercase dark:text-sky-300">
                        Screen issues
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {screenIssues.map((issue) => renderIssueChip(issue))}
                      </div>
                    </div>
                  )}
                  {flowIssues.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium tracking-wider text-amber-700 uppercase dark:text-amber-300">
                        Flow issues
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {flowIssues.map((issue) => renderIssueChip(issue))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
          Custom
        </p>
        <button
          type="button"
          onClick={onSelectOther}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[13px] leading-tight",
            "border-dashed border-neutral-300 bg-white text-neutral-700 transition-colors",
            "hover:border-red-300 hover:bg-red-50 hover:text-red-700",
            "dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200",
            "dark:hover:border-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300",
          )}
        >
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100">
            O
          </span>
          <span>Other...</span>
        </button>
      </div>
    </div>
  );
}

/** Pass / Issue buttons on a checklist step. */
function ChecklistMarkToggle({
  label,
  mark,
  onMark,
}: {
  label: string;
  mark?: ChecklistMark;
  onMark: (mark: ChecklistMark) => void;
}) {
  const base =
    "cursor-pointer px-2 py-1 text-xs font-semibold transition-colors";
  return (
    <div
      role="group"
      aria-label={`${label} result`}
      className="flex shrink-0 overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700"
    >
      <button
        type="button"
        aria-pressed={mark === "pass"}
        onClick={() => onMark("pass")}
        className={cn(
          base,
          mark === "pass"
            ? "bg-green-600 text-white dark:bg-green-700"
            : "bg-white text-neutral-600 hover:bg-green-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-green-950/40",
        )}
      >
        Pass
      </button>
      <button
        type="button"
        aria-pressed={mark === "issue"}
        onClick={() => onMark("issue")}
        className={cn(
          base,
          "border-l border-neutral-300 dark:border-neutral-700",
          mark === "issue"
            ? "bg-red-600 text-white dark:bg-red-700"
            : "bg-white text-neutral-600 hover:bg-red-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-red-950/40",
        )}
      >
        Issue
      </button>
    </div>
  );
}
