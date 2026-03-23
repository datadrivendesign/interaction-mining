"use client";

import { useState } from "react";
import { TraceFormData } from "../../../edit/components/types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ReviewPanelAndroid({
  traceData,
  isAdmin,
  summarizeFeedback,
  onSummarizeFeedbackChange,
  isSubmitting,
}: {
  traceData: TraceFormData;
  isAdmin: boolean;
  summarizeFeedback: string;
  onSummarizeFeedbackChange: (value: string) => void;
  isSubmitting: boolean;
}) {
  return (
    <aside className="w-full h-full flex flex-col min-h-0">
      {/* Header strip */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 h-9 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950">
        <span className={cn("size-1.5 rounded-full shrink-0", isAdmin ? "bg-amber-500" : "bg-neutral-400")} />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          {isAdmin ? "Admin Review" : "Owner Review"}
        </span>
      </div>

      {/* Scrollable content */}
      {isAdmin && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <div className="flex flex-col gap-0 w-full rounded-md border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {/* Summarize */}
            <div className="flex flex-col gap-1.5 p-3 border-l-2 border-l-violet-500">
              <Label htmlFor="summarizeFeedback" className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">
                Summarize
              </Label>
              <Textarea
                className="w-full min-h-[3.5rem] resize-y text-xs border-0 p-0 shadow-none focus-visible:ring-0 bg-transparent"
                id="summarizeFeedback"
                placeholder="Feedback on task description…"
                value={summarizeFeedback}
                onChange={(e) => onSummarizeFeedbackChange(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
