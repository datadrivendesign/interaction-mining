"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { AlertCircle, MessageSquare, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FrameData } from "../../../edit/components/types";
import {
  ISSUES_BY_CATEGORY,
  TRACE_ISSUE_CATEGORIES,
  TraceIssueCategory,
} from "./trace-issues";

interface ScreenComment {
  id: string;
  text: string;
}

export function ScreenCommentsPanel({
  screens,
  activeScreenId,
}: {
  screens: FrameData[];
  activeScreenId: string | null;
}) {
  const [commentsByScreen, setCommentsByScreen] = useState<
    Record<string, ScreenComment[]>
  >({});
  const [draft, setDraft] = useState("");
  const [showTextarea, setShowTextarea] = useState(false);
  const [selectKey, setSelectKey] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sortedScreens = [...screens].sort((a, b) => a.timestamp - b.timestamp);
  const activeScreen =
    sortedScreens.find((s) => s.id === activeScreenId) ??
    sortedScreens[0] ??
    null;
  const activeIndex = activeScreen ? sortedScreens.indexOf(activeScreen) : -1;
  const screenLabel = activeScreen ? `Screen ${activeIndex + 1}` : "No screen selected";
  const comments = activeScreen ? (commentsByScreen[activeScreen.id] ?? []) : [];

  const addComment = () => {
    if (!draft.trim() || !activeScreen) return;
    setCommentsByScreen((prev) => ({
      ...prev,
      [activeScreen.id]: [
        ...(prev[activeScreen.id] ?? []),
        { id: crypto.randomUUID(), text: draft.trim() },
      ],
    }));
    setDraft("");
    setShowTextarea(false);
    setSelectKey((k) => k + 1);
  };

  const removeComment = (id: string) => {
    if (!activeScreen) return;
    setCommentsByScreen((prev) => ({
      ...prev,
      [activeScreen.id]: (prev[activeScreen.id] ?? []).filter((c) => c.id !== id),
    }));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
    if (e.key === "Escape") {
      setShowTextarea(false);
      setDraft("");
      setSelectKey((k) => k + 1);
    }
  };

  const onQuickPick = (value: string) => {
    if (value === "__other__") {
      setDraft("");
    } else {
      const issue = Object.values(ISSUES_BY_CATEGORY)
        .flat()
        .find((i) => i.id === value);
      setDraft(issue?.annotation ?? "");
    }
    setShowTextarea(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
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
            Select an issue type to flag a problem on this screen. Pick <span className="font-medium text-neutral-700 dark:text-neutral-300">Other…</span> to write a custom note.
          </p>
          <Select key={selectKey} onValueChange={onQuickPick}>
            <SelectTrigger
              className={cn(
                "w-full h-9 text-xs font-medium",
                "border-neutral-300 dark:border-neutral-700",
                "bg-white dark:bg-neutral-900",
                "hover:border-red-400 dark:hover:border-red-600",
                "focus:border-red-500 dark:focus:border-red-500",
                "focus:ring-red-500/20 dark:focus:ring-red-500/20",
                "transition-colors",
              )}
            >
              <SelectValue placeholder="Flag an issue on this screen…" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ISSUES_BY_CATEGORY) as TraceIssueCategory[]).map(
                (category) => (
                  <SelectGroup key={category}>
                    <SelectLabel className="text-[10px] font-semibold uppercase tracking-wider">
                      {TRACE_ISSUE_CATEGORIES[category]}
                    </SelectLabel>
                    {ISSUES_BY_CATEGORY[category].map((issue) => (
                      <SelectItem key={issue.id} value={issue.id} className="text-xs">
                        {issue.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ),
              )}
              <SelectSeparator />
              <SelectGroup>
                <SelectItem value="__other__" className="text-xs font-medium">
                  Other…
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {showTextarea && (
            <>
              <Textarea
                ref={textareaRef}
                className="h-14 min-h-0 resize-none text-xs"
                placeholder={`Edit template or describe the issue… (Enter to add)`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!activeScreen}
              />
              <Button
                size="sm"
                className="w-full h-7 text-xs"
                onClick={addComment}
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
              {comments.map((comment, i) => (
                <div
                  key={comment.id}
                  className="group flex items-start gap-1.5 rounded px-2 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <AlertCircle className="size-3 text-red-400 shrink-0 mt-0.5" />
                  <p className="flex-1 text-[11px] text-neutral-700 dark:text-neutral-300 leading-snug whitespace-pre-wrap">
                    {comment.text}
                  </p>
                  <button
                    onClick={() => removeComment(comment.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-neutral-400 hover:text-red-500"
                    aria-label="Remove"
                  >
                    <X className="size-3" />
                  </button>
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
