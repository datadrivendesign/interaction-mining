"use client";

import Link from "next/link";
import { TraceFormData } from "../../../edit/components/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function ReviewContextPanelAndroid({
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
        <span
          className={cn(
            "size-1.5 rounded-full shrink-0",
            isAdmin ? "bg-amber-500" : "bg-neutral-400",
          )}
        />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          {isAdmin ? "Admin Review" : "Owner Review"}
        </span>
        {isAdmin && (
          <Button
            size="sm"
            className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-neutral-300 transition-colors hover:text-neutral-100 dark:text-neutral-700 dark:hover:text-neutral-800"
          >
            <ArrowLeft className="w-2 h-2" />
            <Link href="/admin/tasks">Back to list</Link>
          </Button>
        )}
      </div>

      {isAdmin && traceData.description && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              Task
            </span>
            <p className="text-[15px] font-medium leading-6 text-neutral-800 dark:text-neutral-100">
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
