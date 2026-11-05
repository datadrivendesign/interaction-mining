"use client";

import Link from "next/link";
import { CircleHelp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import Kbd from "@/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { canEditInMode, VerdictMode } from "./verdict-mode";
import { SaveProgress } from "./use-review-verdict-actions";

const DENY_LABEL: Record<Exclude<VerdictMode, "none">, string> = {
  review: "Send back",
  direct: "Deny",
  final: "Deny",
};

const APPROVE_HINT: Record<Exclude<VerdictMode, "none">, string> = {
  review: "Approve sends it to final check",
  direct: "Approve publishes the trace",
  final: "Approve publishes the trace",
};

export function VerdictBar({
  mode,
  hasDraft,
  issueSummary,
  isSubmitting,
  saveProgress,
  onApprove,
  onDeny,
  onSkip,
  editHref,
  additionalShortcuts = [],
}: {
  mode: Exclude<VerdictMode, "none">;
  /** False when the worker never saved a draft: nothing to approve. */
  hasDraft: boolean;
  issueSummary: string;
  isSubmitting: boolean;
  saveProgress: SaveProgress | null;
  onApprove: () => void;
  onDeny: () => void;
  onSkip: () => void;
  /** Edit page link; shown in every verdict mode, draft or not. */
  editHref?: string;
  additionalShortcuts?: { label: string; keys: string }[];
}) {
  const canApprove = hasDraft;
  // With no draft the edit page starts from the recording, so a reviewer can
  // still build the trace instead of sending it back.
  const canEdit = canEditInMode(mode) && !!editHref;
  const denyLabel = DENY_LABEL[mode];

  let status = issueSummary;
  if (saveProgress) {
    status = `Saving screens ${saveProgress.done} of ${saveProgress.total}. Keep this page open.`;
  } else if (!canApprove) {
    status = canEdit
      ? "No draft saved. Edit it yourself or send it back to the worker."
      : "No draft saved. Send back to worker.";
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
      <p
        className="min-w-0 flex-1 basis-48 truncate text-xs text-neutral-600 dark:text-neutral-300"
        aria-live="polite"
        title={canApprove ? APPROVE_HINT[mode] : undefined}
      >
        {status}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {canEdit &&
          (isSubmitting ? (
            <Button size="sm" variant="outline" className="min-w-0" disabled>
              <Pencil className="size-3.5" aria-hidden />
              <span>Edit</span>
              <span className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400">
                Ctrl+Shift+E
              </span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="min-w-0"
              asChild
              title="Fix it yourself on the edit page. Comments you have not sent are not kept."
            >
              <Link href={editHref}>
                <Pencil className="size-3.5" aria-hidden />
                <span>Edit</span>
                <span className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400">
                  Ctrl+Shift+E
                </span>
              </Link>
            </Button>
          ))}
        <Button
          size="sm"
          variant="outline"
          className="min-w-0"
          onClick={onSkip}
          disabled={isSubmitting}
        >
          <span>Skip</span>
          <span className="text-[10px] font-normal text-neutral-500 dark:text-neutral-400">
            Ctrl+Shift+S
          </span>
        </Button>
        {canApprove && (
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
        )}
        <Button
          size="sm"
          className="min-w-0 bg-red-500 text-white hover:bg-red-600 dark:bg-red-700! dark:text-white! dark:hover:bg-red-800!"
          onClick={onDeny}
          disabled={isSubmitting}
        >
          <span>{denyLabel}</span>
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
                Review and verdict shortcuts currently available in this view.
              </p>
            </div>
            <div className="space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
              {canApprove && (
                <div className="flex items-center justify-between gap-3">
                  <span>Approve capture</span>
                  <Kbd className="text-[10px]">Ctrl+Shift+A</Kbd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span>{denyLabel} capture</span>
                <Kbd className="text-[10px]">Ctrl+Shift+D</Kbd>
              </div>
              {canEdit && (
                <div className="flex items-center justify-between gap-3">
                  <span>Edit capture</span>
                  <Kbd className="text-[10px]">Ctrl+Shift+E</Kbd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span>Skip capture</span>
                <Kbd className="text-[10px]">Ctrl+Shift+S</Kbd>
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
