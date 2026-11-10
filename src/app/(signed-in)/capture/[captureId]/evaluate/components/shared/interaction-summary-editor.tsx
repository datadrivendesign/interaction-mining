"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Same limit as the edit page's Interaction Summary field. */
const SUMMARY_MAX_LENGTH = 110;

/**
 * The capture's Interaction Summary in the review sidebar, with an Edit
 * button for staff. Saving writes a new draft like any other fix; Enter
 * saves, Shift+Enter adds a line.
 */
export function InteractionSummaryEditor({
  summary,
  canEdit,
  isSaving,
  onSave,
  textClassName,
}: {
  summary: string;
  canEdit: boolean;
  isSaving: boolean;
  onSave: (text: string) => Promise<boolean>;
  textClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState(summary);
  const trimmed = text.trim();
  const blockedReason = !trimmed
    ? "The summary can't be empty."
    : trimmed === summary.trim()
      ? "Nothing changed yet."
      : null;

  const save = async () => {
    if (blockedReason || isSaving) return;
    if (await onSave(trimmed)) setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-neutral-600 uppercase dark:text-neutral-300">
          Interaction summary
        </h2>
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            disabled={isSaving}
            onClick={() => {
              setText(summary);
              setIsOpen(true);
            }}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        )}
      </div>
      <p
        className={cn(
          "leading-6 font-medium break-words text-neutral-800 dark:text-neutral-100",
          textClassName,
        )}
      >
        {summary.trim() || (
          <span className="font-normal text-neutral-500 italic">
            No summary yet
          </span>
        )}
      </p>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) setIsOpen(false);
        }}
      >
        <DialogContent
          onKeyDown={(event) => {
            // Page hotkeys stay off while typing; Esc still closes.
            if (event.key !== "Escape") event.stopPropagation();
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit interaction summary</DialogTitle>
            <DialogDescription>
              Say what happens across all the screens, in one or two short
              sentences. Do not include private information.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={text}
            maxLength={SUMMARY_MAX_LENGTH}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void save();
              }
            }}
            placeholder="Open the calendar app and add a lunch event for Friday."
            autoFocus
          />
          <p className="text-right text-xs text-neutral-500">
            {text.length}/{SUMMARY_MAX_LENGTH} · Enter to save, Shift+Enter for
            a new line
          </p>
          <DialogFooter className="items-center gap-2">
            {blockedReason && (
              <p className="mr-auto text-xs text-neutral-500">
                {blockedReason}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSaving || !!blockedReason}
              onClick={() => void save()}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
