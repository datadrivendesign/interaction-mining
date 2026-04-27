"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

/**
 * Split a newline-separated feedback string into individual items.
 * Trims whitespace and drops empty lines.
 */
function parseFeedbackItems(feedback: string): string[] {
  return feedback
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
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
}

/**
 * Persistent inline checklist that replaces the old FeedbackDialog modal.
 * Renders at the top of the editor area and shows only the feedback relevant
 * to the current workflow step.
 *
 * Checkbox state is ephemeral (React state only, no DB persistence).
 * Pass `key={stepIndex}` from the parent to reset state on step change.
 */
export function FeedbackChecklist({
  feedback,
  stepLabel,
}: FeedbackChecklistProps) {
  const items = parseFeedbackItems(feedback);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [isOpen, setIsOpen] = useState(true);

  const remaining = items.length - checkedItems.size;
  const allDone = remaining === 0;

  // Auto-collapse when every item has been checked off.
  useEffect(() => {
    if (allDone && items.length > 0) {
      setIsOpen(false);
    }
  }, [allDone, items.length]);

  // Nothing to show → render nothing.
  if (items.length === 0) return null;

  const handleToggle = (index: number, checked: boolean) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (checked) next.add(index);
      else next.delete(index);
      return next;
    });
  };

  return (
    <div className="flex-shrink-0 w-full border-b border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 cursor-pointer">
          <div className="flex items-center gap-2">
            {allDone ? (
              <Check className="size-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
            )}
            <span
              className={cn(
                "text-sm font-semibold",
                allDone
                  ? "text-green-800 dark:text-green-200"
                  : "text-amber-800 dark:text-amber-200",
              )}
            >
              {stepLabel} Feedback
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                allDone
                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  : "bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200",
              )}
            >
              {allDone ? "All done" : `${remaining} remaining`}
            </Badge>
            <ChevronDown
              className={cn(
                "size-4 text-amber-600 dark:text-amber-400 transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="px-4 pb-3 space-y-1 max-h-35 overflow-y-auto">
            {items.map((item, index) => {
              const isChecked = checkedItems.has(index);
              const id = `feedback-${index}`;
              return (
                <li key={index} className="flex items-start gap-3 py-1.5">
                  <Checkbox
                    id={id}
                    checked={isChecked}
                    onCheckedChange={(v) => handleToggle(index, v === true)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={id}
                    className={cn(
                      "text-sm leading-snug cursor-pointer",
                      isChecked
                        ? "line-through text-muted-foreground"
                        : "text-neutral-800 dark:text-neutral-200",
                    )}
                  >
                    {renderInlineMarkdown(item)}
                  </Label>
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
