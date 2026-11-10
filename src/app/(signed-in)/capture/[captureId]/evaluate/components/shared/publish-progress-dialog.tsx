"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { SaveProgress } from "./use-review-verdict-actions";

/**
 * Blocking progress while the admin's Approve renders and uploads every
 * screen. It cannot be dismissed: closing it would not stop the upload, and
 * leaving the page mid-save leaves a trace without screens. It closes itself
 * when the save ends; errors are shown as toasts by the verdict hook.
 */
export function PublishProgressDialog({
  progress,
}: {
  progress: SaveProgress | null;
}) {
  const total = progress?.total ?? 0;
  const done = progress?.done ?? 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <AlertDialog open={progress !== null}>
      <AlertDialogContent
        className="max-w-[calc(100%-2rem)] sm:max-w-md"
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Publishing trace
          </AlertDialogTitle>
          <AlertDialogDescription>
            Keep this page open until it finishes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Progress value={percent} aria-label="Screens saved" />
          <p
            className="text-sm text-muted-foreground tabular-nums"
            aria-live="polite"
          >
            {total > 0
              ? `Saving screens ${done} of ${total}`
              : "Preparing screens…"}
          </p>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
