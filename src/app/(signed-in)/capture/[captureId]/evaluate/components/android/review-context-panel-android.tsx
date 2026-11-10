"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function ReviewContextPanelAndroid({
  isAdmin,
  listHref,
  summary,
}: {
  isAdmin: boolean;
  /** Task list for this viewer's role. */
  listHref: string;
  /** The Interaction Summary block (with Edit for staff). */
  summary?: ReactNode;
}) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col">
      {/* Header strip */}
      <div className="flex h-9 flex-shrink-0 items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 dark:border-neutral-800 dark:bg-neutral-950">
        <span
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            isAdmin ? "bg-amber-500" : "bg-neutral-400",
          )}
        />
        <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase dark:text-neutral-400">
          {isAdmin ? "Review" : "Owner Review"}
        </span>
        {isAdmin && (
          <Button
            size="sm"
            className="ml-auto text-[10px] font-semibold tracking-widest text-neutral-300 uppercase transition-colors hover:text-neutral-100 dark:text-neutral-700 dark:hover:text-neutral-800"
          >
            <ArrowLeft className="h-2 w-2" />
            <Link href={listHref}>Back to list</Link>
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {summary}
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
