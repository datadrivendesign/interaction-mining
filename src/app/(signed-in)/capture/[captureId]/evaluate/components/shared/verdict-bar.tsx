"use client";

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Kbd from "@/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function VerdictBar({
  issueSummary,
  isSubmitting,
  onApprove,
  onDeny,
  additionalShortcuts = [],
}: {
  issueSummary: string;
  isSubmitting: boolean;
  onApprove: () => void;
  onDeny: () => void;
  additionalShortcuts?: { label: string; keys: string }[];
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
      <p className="min-w-0 flex-1 truncate text-xs text-neutral-600 dark:text-neutral-300">
        {issueSummary}
      </p>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="min-w-0 bg-green-600 text-white hover:bg-green-700 dark:bg-green-700! dark:text-white! dark:hover:bg-green-800!"
          onClick={onApprove}
          disabled={isSubmitting}
        >
          <span>Approve</span>
          <span className="text-[10px] font-normal text-green-100">
            Ctrl+Shift+A
          </span>
        </Button>
        <Button
          size="sm"
          className="min-w-0 bg-red-500 text-white hover:bg-red-600 dark:bg-red-700! dark:text-white! dark:hover:bg-red-800!"
          onClick={onDeny}
          disabled={isSubmitting}
        >
          <span>Deny</span>
          <span className="text-[10px] font-normal text-red-100">
            Ctrl+Shift+D
          </span>
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              className="shrink-0"
              aria-label="Keyboard shortcuts"
            >
              <CircleHelp className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 space-y-2">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Keyboard shortcuts
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Verdict actions currently available in review.
              </p>
            </div>
            <div className="space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
              <div className="flex items-center justify-between gap-3">
                <span>Approve capture</span>
                <Kbd className="text-[10px]">Ctrl+Shift+A</Kbd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Deny capture</span>
                <Kbd className="text-[10px]">Ctrl+Shift+D</Kbd>
              </div>
              {additionalShortcuts.length > 0 && (
                <>
                  <div className="border-t border-neutral-200 pt-2 dark:border-neutral-800" />
                  {additionalShortcuts.map((shortcut) => (
                    <div
                      key={`${shortcut.label}-${shortcut.keys}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <span>{shortcut.label}</span>
                      <Kbd className="text-[10px]">{shortcut.keys}</Kbd>
                    </div>
                  ))}
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
