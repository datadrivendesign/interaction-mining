import Image from "next/image";
import Link from "next/link";
import { Play, Eye, Edit, Pencil } from "lucide-react";
import { CaptureStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";

import { prettyOS } from "@/lib/utils";
import { statusConfig } from "./config";

export function CaptureCard({
  capture,
  status,
}: {
  capture: any;
  status: CaptureStatus;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const getActionButton = () => {
    switch (status) {
      case CaptureStatus.CREATED:
        return (
          <Link href={`/capture/${capture.id}/start`}>
            <Button size="sm" variant="default">
              <Play className="mr-2 size-3" />
              Start
            </Button>
          </Link>
        );
      case CaptureStatus.PROCESSING:
        return (
          <Link href={`/capture/${capture.id}/start`}>
            <Button size="sm" variant="default">
              <Pencil className="mr-2 size-3" />
              Process
            </Button>
          </Link>
        );
      case CaptureStatus.REVIEWING:
        return (
          <Link href={`/capture/${capture.id}/evaluate`}>
            <Button size="sm" variant="default">
              <Eye className="mr-2 size-3" />
              Review
            </Button>
          </Link>
        );
      default:
        return (
          <Link href={`/capture/${capture.id}/edit`}>
            <Button size="sm" variant="outline">
              <Edit className="mr-2 size-3" />
              Edit
            </Button>
          </Link>
        );
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
        {getActionButton()}
        <p className="text-xs text-muted-foreground self-end">
          {prettyOS(capture.task?.os)} •{" "}
          {capture.task?.description?.slice(0, 30)}
          {`${capture.task?.description?.length > 30 ? "..." : ""}`}
        </p>
      </div>
    </div>
  );
}
