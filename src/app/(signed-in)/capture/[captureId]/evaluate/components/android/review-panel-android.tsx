"use client";

import { TraceFormData } from "../../../edit/components/types";
import { cn } from "@/lib/utils";

export function ReviewPanelAndroid({
  traceData,
  isAdmin,
}: {
  traceData: TraceFormData;
  isAdmin: boolean;
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

      {isAdmin && traceData.description && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <div className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              Task
            </span>
            <p className="mt-1 text-xs leading-snug text-neutral-600 dark:text-neutral-400">
              {traceData.description}
            </p>
          </div>
          <div className="mt-3 rounded-md border border-dashed border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
            <p className="text-[11px] font-medium text-neutral-700 dark:text-neutral-200">
              Feedback is authored in the right panel.
            </p>
            <p className="mt-1 text-[10px] leading-snug text-neutral-500 dark:text-neutral-400">
              Use issue chips or Other to add annotate, redact, and summarize
              feedback.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
