"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PanelRight,
  PanelTop,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { FrameData } from "./types";
import { parseFeedbackChecklistItems } from "../../evaluate/utils/review-feedback";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";

/**
 * Split a newline-separated feedback string into individual items.
 * Trims whitespace and drops empty lines.
 */
function getChecklistItemId({
  screenId,
  originalScreenNumber,
  index,
}: {
  screenId: string | null;
  originalScreenNumber: number | null;
  index: number;
}) {
  if (screenId) {
    return `screen:${screenId}:${index}`;
  }
  if (originalScreenNumber !== null) {
    return `legacy:${originalScreenNumber}:${index}`;
  }
  return `flow:${index}`;
}

/**
 * Lightweight inline-markdown renderer for evaluator feedback text.
 * Handles: **bold**, `code`, and strips leading bullet markers (- or *).
 * Returns an array of React nodes suitable for inline rendering.
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Strip leading bullet markers (e.g., "- item" or "* item")
  const cleaned = text.replace(/^[-*]\s+/, "");

  const nodes: React.ReactNode[] = [];
  // Match **bold** or `code` segments
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cleaned)) !== null) {
    // Push text before the match
    if (match.index > lastIndex) {
      nodes.push(cleaned.slice(lastIndex, match.index));
    }
    if (match[2]) {
      // **bold**
      nodes.push(
        <strong key={match.index} className="font-semibold">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      // `code`
      nodes.push(
        <code
          key={match.index}
          className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-xs font-mono"
        >
          {match[3]}
        </code>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  // Push remaining text
  if (lastIndex < cleaned.length) {
    nodes.push(cleaned.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [cleaned];
}

interface FeedbackChecklistProps {
  /** Raw newline-separated feedback string for the current step. */
  feedback: string;
  /** Human-readable step name shown in the header, e.g. "Annotate". */
  stepLabel: string;
  screens: FrameData[];
  onJumpToScreen?: (screenId: string) => void;
  layoutMode: ChecklistLayoutMode;
  onLayoutModeChange: (mode: ChecklistLayoutMode) => void;
  checkedItems: Set<string>;
  onCheckedItemsChange: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export type ChecklistLayoutMode = "top" | "side";

/**
 * Persistent inline checklist that replaces the old FeedbackDialog modal.
 * Renders at the top of the editor area and shows only the feedback relevant
 * to the current workflow step.
 *
 * Checkbox state is ephemeral and controlled by the parent (React state only,
 * no DB persistence). The parent resets it when the step or layout changes.
 */
export function FeedbackChecklist({
  feedback,
  stepLabel,
  screens,
  onJumpToScreen,
  layoutMode,
  onLayoutModeChange,
  checkedItems,
  onCheckedItemsChange,
}: FeedbackChecklistProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const items = useMemo(
    () =>
      parseFeedbackChecklistItems({
        text: feedback,
        screens,
      }),
    [feedback, screens],
  );
  const remaining = items.length - checkedItems.size;
  const allDone = remaining === 0;
  const summaryLabel = `${stepLabel} Feedback`;

  useEffect(() => {
    setIsCollapsed(false);
  }, [feedback, layoutMode]);

  useEffect(() => {
    if (!allDone && checkedItems.size === 0) {
      setIsCollapsed(false);
    }
  }, [allDone, checkedItems.size]);

  // Auto-collapse when every item has been checked off.
  useEffect(() => {
    if (!allDone || items.length === 0) {
      return;
    }

    setIsCollapsed(true);
  }, [allDone, items.length]);

  // Nothing to show → render nothing.
  if (items.length === 0) return null;

  const handleToggle = (itemId: string, checked: boolean) => {
    onCheckedItemsChange((prev) => {
      const next = new Set(prev);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  const ChecklistList = () => {
    return (
      <ul className="max-h-28 space-y-0.5 overflow-y-auto border-t border-amber-200/70 px-3 py-2 dark:border-amber-800/60">
        {items.map((item, index) => {
          const itemId = getChecklistItemId({
            screenId: item.screenId,
            originalScreenNumber: item.originalScreenNumber,
            index,
          });
          const isJumpable = Boolean(
            item.screenId && !item.unresolved && onJumpToScreen,
          );
          const isChecked = checkedItems.has(itemId);
          const id = `feedback-${itemId}`;
          return (
            <li key={itemId} className="flex items-start gap-2 py-1">
              <Checkbox
                id={id}
                checked={isChecked}
                onCheckedChange={(v) => handleToggle(itemId, v === true)}
                className="mt-0.5 shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="text-xs leading-snug">
                  {isJumpable ? (
                    <button
                      type="button"
                      className="inline-flex items-start gap-1 text-left cursor-pointer"
                      onClick={() => onJumpToScreen?.(item.screenId!)}
                    >
                      <span
                        className={cn(
                          "underline decoration-1 underline-offset-2 transition-colors",
                          isChecked
                            ? "line-through text-muted-foreground decoration-muted-foreground"
                            : "text-violet-700 decoration-violet-400 hover:text-violet-800 dark:text-violet-300 dark:decoration-violet-500 dark:hover:text-violet-200",
                        )}
                      >
                        {renderInlineMarkdown(item.text)}
                      </span>
                      <ExternalLink
                        className={cn(
                          "mt-0.5 size-3 shrink-0 transition-colors",
                          isChecked
                            ? "text-muted-foreground"
                            : "text-violet-700 dark:text-violet-300",
                        )}
                      />
                    </button>
                  ) : (
                    <div
                      className={cn(
                        isChecked
                          ? "line-through text-muted-foreground"
                          : "text-neutral-800 dark:text-neutral-200",
                      )}
                    >
                      {renderInlineMarkdown(item.text)}
                    </div>
                  )}
                </div>
                {item.unresolved && (
                  <p className="text-[10px] leading-snug text-amber-700 dark:text-amber-300">
                    This feedback could not be safely linked to a current
                    screen.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const LayoutToggleGroup = () => {
    return (
      <ButtonGroup className="rounded-md border border-amber-300/80 bg-amber-100/70 p-0.5 dark:border-amber-700/70 dark:bg-amber-900/30">
        <Button
          key={"top"}
          variant="ghost"
          size="sm"
          onClick={() => onLayoutModeChange("top")}
          className={cn(
            "h-6 gap-1 rounded-sm px-2 text-[10px] font-semibold",
            layoutMode === "top"
              ? "bg-white text-amber-900 shadow-xs dark:bg-amber-950 dark:text-amber-100"
              : "text-amber-700 hover:bg-amber-200/50 dark:text-amber-300",
          )}
        >
          <PanelTop className="size-3" />
          Top
        </Button>
        <Button
          key={"side"}
          variant="ghost"
          size="sm"
          onClick={() => onLayoutModeChange("side")}
          className={cn(
            "h-6 gap-1 rounded-sm px-2 text-[10px] font-semibold",
            layoutMode === "side"
              ? "bg-white text-amber-900 shadow-xs dark:bg-amber-950 dark:text-amber-100"
              : "text-amber-700 hover:bg-amber-200/50 dark:text-amber-300",
          )}
        >
          <PanelRight className="size-3" />
          Side
        </Button>
      </ButtonGroup>
    );
  };

  const SideCollapsedFeedbackChecklist = () => {
    return (
      <aside className="flex h-full w-12 shrink-0 flex-col items-center gap-2 border-l border-amber-200/80 bg-amber-50/80 px-1 py-2 dark:border-amber-800/60 dark:bg-amber-950/20">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-amber-800 hover:bg-amber-200/60 dark:text-amber-100 dark:hover:bg-amber-900/40"
          onClick={() => setIsCollapsed(false)}
          aria-label="Expand feedback checklist"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex flex-col items-center gap-1 rounded-md border border-amber-300/80 bg-amber-100/70 px-1 py-1 dark:border-amber-700/70 dark:bg-amber-900/30">
          {allDone ? (
            <Check className="size-3.5 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="size-3.5 text-amber-600 dark:text-amber-400" />
          )}
          <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-200">
            {allDone ? "0" : remaining}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-amber-700 hover:bg-amber-200/60 dark:text-amber-300 dark:hover:bg-amber-900/40"
          onClick={() => onLayoutModeChange("top")}
          aria-label="Move checklist to top"
        >
          <PanelTop className="size-4" />
        </Button>
      </aside>
    );
  };

  const SideLayoutFeedbackExpandedChecklist = () => {
    return (
      <aside className="flex h-full w-56 shrink-0 flex-col border-l border-amber-200/80 bg-amber-50/70 transition-[width] dark:border-amber-800/60 dark:bg-amber-950/15">
        <div className="flex items-center justify-between gap-2 px-3 py-1.5">
          <LayoutToggleGroup />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-amber-700 hover:bg-amber-200/60 dark:text-amber-300 dark:hover:bg-amber-900/40"
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse feedback checklist"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="border-b border-amber-200/70 px-3 py-2 dark:border-amber-800/60">
          <div className="text-[11px] font-semibold text-amber-900 dark:text-amber-100">
            {summaryLabel}
          </div>
          <div className="text-[10px] text-amber-700 dark:text-amber-300">
            {allDone
              ? "All feedback items completed."
              : `${remaining} items remaining in this step.`}
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <ChecklistList />
        </div>
      </aside>
    );
  };

  const TopLayoutFeedbackChecklist = () => {
    return (
      <div className="flex-shrink-0 w-full border-b border-amber-300 bg-amber-50/95 dark:border-amber-700 dark:bg-amber-950/30">
        <div className="flex w-full items-center justify-between gap-2 px-3 py-1.5">
          <button
            type="button"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
            onClick={() => setIsCollapsed((current) => !current)}
          >
            {allDone ? (
              <Check className="size-3.5 shrink-0 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <span
              className={cn(
                "truncate text-xs font-semibold",
                allDone
                  ? "text-green-800 dark:text-green-200"
                  : "text-amber-800 dark:text-amber-200",
              )}
            >
              {summaryLabel}
            </span>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            <LayoutToggleGroup />

            <Badge
              variant="secondary"
              className={cn(
                "px-1.5 py-0 text-[10px] font-semibold",
                allDone
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200",
              )}
            >
              {allDone ? "All done" : `${remaining} remaining`}
            </Badge>
            <ChevronDown
              className={cn(
                "size-3.5 text-amber-600 transition-transform duration-200 dark:text-amber-400",
                !isCollapsed && "rotate-180",
              )}
            />
          </div>
        </div>

        <Collapsible
          open={!isCollapsed}
          onOpenChange={(open) => setIsCollapsed(!open)}
        >
          <CollapsibleTrigger className="sr-only">
            Toggle checklist
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ChecklistList />
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  if (layoutMode === "side") {
    if (isCollapsed) {
      return <SideCollapsedFeedbackChecklist />;
    }
    return <SideLayoutFeedbackExpandedChecklist />;
  }

  return <TopLayoutFeedbackChecklist />;
}
