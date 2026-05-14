"use client";

import { ReactNode } from "react";

export function CommentSection({
  title,
  count,
  emptyMessage,
  children,
}: {
  title: string;
  count: number;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          {title}
        </span>
        {count > 0 && (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-mono text-[10px] leading-none text-red-600 dark:bg-red-950 dark:text-red-400">
            {count}
          </span>
        )}
      </div>

      {count === 0 ? (
        <p className="px-3 pb-3 text-[10px] text-neutral-400 dark:text-neutral-600">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-1 px-2 pb-2">{children}</div>
      )}
    </div>
  );
}
