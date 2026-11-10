"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { takeOverCapture } from "../../utils/capture-actions";

/**
 * "Record it again myself": for a wrong or missing recording whose worker
 * cannot redo it. The warning names everything that changes before the
 * reviewer confirms. Plain wording: reviewers read English as a second
 * language.
 */
export function TakeOverDialog({
  captureId,
  disabled,
}: {
  captureId: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    if (pending) return;
    setPending(true);
    const res = await takeOverCapture(captureId);
    if (!res.ok) {
      setPending(false);
      toast.error(res.message);
      return;
    }
    toast.success("The capture is yours now. Record the task, then upload it.");
    setOpen(false);
    router.push(`/capture/${captureId}/start`);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="min-w-0 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
          disabled={disabled}
          title="The recording is wrong or missing, and you can record the task yourself."
        >
          <Video className="size-3.5" aria-hidden />
          <span>Record it again myself</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Record this capture again yourself?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                Use this only when the recording is wrong or missing, and you
                can record the task on your own phone.
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  The capture becomes <strong>yours</strong>. The worker who
                  recorded it will not see it anymore.
                </li>
                <li>
                  The current video, screens, gestures, descriptions, and
                  redactions are <strong>hidden</strong>. You start again from
                  the beginning.
                </li>
                <li>
                  You record the task again, upload it, and finish it like any
                  capture. Then another reviewer checks it.
                </li>
              </ul>
              <p className="text-xs text-muted-foreground">
                The old files will be hidden and you will not be able to access
                them.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => void confirm()}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Taking over…
              </>
            ) : (
              "Yes, record it again"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
