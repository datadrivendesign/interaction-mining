"use client";
import Image from "next/image";
import Link from "next/link";
import { Play, Eye, Edit, Pencil, Trash } from "lucide-react";
import { CaptureStatus } from "@prisma/client";

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

// Separate components for each action type
function StartButton({ captureId }: { captureId: string }) {
  return (
    <Link href={`/capture/${captureId}/start`}>
      <Button size="sm" variant="default">
        <Play className="mr-2 size-3" />
        Start
      </Button>
    </Link>
  );
}

function ProcessButton({ captureId }: { captureId: string }) {
  return (
    <Link href={`/capture/${captureId}/start`}>
      <Button size="sm" variant="default">
        <Pencil className="mr-2 size-3" />
        Process
      </Button>
    </Link>
  );
}

function ReviewButton({ captureId }: { captureId: string }) {
  return (
    <Link href={`/capture/${captureId}/evaluate`}>
      <Button size="sm" variant="default">
        <Eye className="mr-2 size-3" />
        Review
      </Button>
    </Link>
  );
}

function EditButton({ captureId }: { captureId: string }) {
  return (
    <Link href={`/capture/${captureId}/edit`}>
      <Button size="sm" variant="outline">
        <Edit className="mr-2 size-3" />
        Edit
      </Button>
    </Link>
  );
}

function DeleteDialog({
  captureId,
  onDelete,
}: {
  captureId: string;
  onDelete: (id: string) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
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
            <Button size="sm" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(captureId)}
            >
              <Trash className="mr-0.5 size-3" />
              Delete
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
}: {
  capture: any;
  status: CaptureStatus;
  onDelete: (id: string) => void;
}) {
  const renderActionButtons = () => {
    switch (status) {
      case CaptureStatus.CREATED:
        return (
          <div className="flex gap-2">
            <StartButton captureId={capture.id} />
            <DeleteDialog captureId={capture.id} onDelete={onDelete} />
          </div>
        );
      case CaptureStatus.PROCESSING:
        return <ProcessButton captureId={capture.id} />;
      case CaptureStatus.REVIEWING:
        return <ReviewButton captureId={capture.id} />;
      default:
        return <EditButton captureId={capture.id} />;
    }
  };

  return (
    <div className="flex flex-row items-center justify-between p-3 border rounded-lg hover:bg-muted-background transition-colors">
      <div className="flex flex-col items-center text-center space-x-3">
        {capture.app?.metadata?.icon ? (
          <Image
            src={capture.app?.metadata?.icon}
            alt="App Icon"
            className="w-10 h-10 rounded-lg object-cover"
            width={40}
            height={40}
          />
        ) : (
          <div className="size-10 rounded-lg bg-muted-background animate-pulse" />
        )}
        <h4 className="font-medium text-sm">
          {capture.app?.metadata?.name ?? "Unnamed App"}
        </h4>
      </div>
      <div className="flex flex-col h-full justify-evenly content-evenly items-center text-center ml-2">
        {renderActionButtons()}
        <p className="text-xs text-muted-foreground self-end">
          {prettyOS(capture.task?.os)} •{" "}
          {capture.task?.description?.slice(0, 30)}
          {`${capture.task?.description?.length > 30 ? "..." : ""}`}
        </p>
      </div>
    </div>
  );
}
