"use client";
import Image from "next/image";
import Link from "next/link";
import { Play, Eye, Edit, Pencil, Trash } from "lucide-react";
import { CaptureStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { Button } from "@/components/ui/button";

import { prettyOS } from "@/lib/utils";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type DashboardCapture = Prisma.CaptureGetPayload<{
  include: { app: true; task: true };
}>;

function hasReviewerFeedback(capture: {
  annotateFeedback?: string | null;
  redactFeedback?: string | null;
  summarizeFeedback?: string | null;
}) {
  return [
    capture.annotateFeedback,
    capture.redactFeedback,
    capture.summarizeFeedback,
  ].some((value) => value?.trim());
}

// Separate components for each action type
function StartButton({ captureId }: { captureId: string }) {
  return (
    <Link href={`/capture/${captureId}/start`}>
      <Button size="sm" variant="default" className="cursor-pointer px-3">
        <Play className="mr-1.5 size-3" />
        Start
      </Button>
    </Link>
  );
}

function ProcessButton({ captureId }: { captureId: string }) {
  return (
    <Link href={`/capture/${captureId}/start`}>
      <Button size="sm" variant="default" className="cursor-pointer px-3">
        <Pencil className="mr-1.5 size-3" />
        Process
      </Button>
    </Link>
  );
}

function ReviewButton({ captureId }: { captureId: string }) {
  return (
    <Link href={`/capture/${captureId}/evaluate`}>
      <Button size="sm" variant="default" className="cursor-pointer px-3">
        <Eye className="mr-1.5 size-3" />
        Review
      </Button>
    </Link>
  );
}

function EditButton({ captureId }: { captureId: string }) {
  return (
    <Link href={`/capture/${captureId}/edit`}>
      <Button size="sm" variant="outline" className="cursor-pointer px-3">
        <Edit className="mr-1.5 size-3" />
        Edit
      </Button>
    </Link>
  );
}

function DeleteDialog({
  captureId,
  onDelete,
  isDeleting,
}: {
  captureId: string;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="destructive"
          className="cursor-pointer px-3"
          disabled={isDeleting}
        >
          <Trash className="mr-0.5 size-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Capture</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this capture?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button size="sm" variant="outline" className="cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              size="sm"
              variant="destructive"
              className="cursor-pointer px-3"
              disabled={isDeleting}
              onClick={() => onDelete(captureId)}
            >
              <Trash className="mr-0.5 size-3" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CaptureCard({
  capture,
  status,
  onDelete,
  isDeleting,
}: {
  capture: DashboardCapture;
  status: CaptureStatus;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
}) {
  const showRevisionRequested =
    status === CaptureStatus.PROCESSING && hasReviewerFeedback(capture);
  const appName = capture.app?.metadata?.name ?? "Unknown app";
  const taskDescription = capture.task?.description ?? "No task description";
  const platformLabel = prettyOS(capture.task?.os ?? "");

  const renderActionButtons = () => {
    switch (status) {
      case CaptureStatus.CREATED:
        return (
          <div className="flex flex-wrap justify-end gap-2">
            <StartButton captureId={capture.id} />
            <DeleteDialog
              captureId={capture.id}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          </div>
        );
      case CaptureStatus.PROCESSING:
        return (
          <div className="flex flex-wrap justify-end gap-2">
            <ProcessButton captureId={capture.id} />
            <DeleteDialog
              captureId={capture.id}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          </div>
        );
      case CaptureStatus.REVIEWING:
        return <ReviewButton captureId={capture.id} />;
      default:
        return <EditButton captureId={capture.id} />;
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-muted-background">
      <div className="flex min-w-0 items-start gap-3">
        <div className="shrink-0">
          {capture.app?.metadata?.icon ? (
            <Image
              src={capture.app?.metadata?.icon}
              alt={`${appName} icon`}
              className="size-10 rounded-lg object-cover"
              width={40}
              height={40}
            />
          ) : (
            <div className="size-10 animate-pulse rounded-lg bg-muted-background" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h4
              className="line-clamp-2 min-w-0 text-sm leading-snug font-medium break-words"
              title={appName}
            >
              {appName}
            </h4>
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground"
                title={platformLabel}
              >
                {platformLabel}
              </Badge>
            </div>
          </div>
          <p
            className="mt-1 line-clamp-2 text-xs leading-snug break-words text-muted-foreground"
            title={taskDescription}
          >
            {taskDescription}
          </p>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap gap-2">
          {showRevisionRequested && (
            <Badge
              className="bg-red-100 text-xs text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
              title="Revision requested"
            >
              Needs revision
            </Badge>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 self-end">
          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
}
