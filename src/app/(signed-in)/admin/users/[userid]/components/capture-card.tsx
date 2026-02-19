"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Capture } from "@/lib/actions";
import { Platform, prettyOS } from "@/lib/utils";
import { CaptureStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

/**
 * CaptureCard displays a single capture card
 * @param capture - The capture to display
 * @returns CaptureCard component
 */
export function CaptureCard({ capture }: { capture: Capture }) {
  return (
    <Card className="rounded-md hover:shadow-sm transition p-2">
      <CardHeader className="flex flex-row items-center gap-4">
        <Image
          src={capture.app?.metadata?.icon || "/placeholder.png"}
          alt="App Icon"
          className="w-10 h-10 rounded object-cover"
          width={40}
          height={40}
        />
        <div className="w-full">
          <div className="flex flex-row items-center gap-2">
            <CardTitle className="text-sm font-medium">
              {capture.app?.metadata?.name ?? "Unnamed App"}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {capture.task?.os
                ? prettyOS(capture.task?.os as Platform)
                : "Unknown OS"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {capture.task?.description ?? "No description"}
          </p>
        </div>
        <div>
          <Badge variant="default">{capture.status}</Badge>
        </div>
        <div>
          <Button variant="link" asChild>
            <Link
              href={
                capture.status === CaptureStatus.REVIEWING
                  ? `/capture/${capture.id}/evaluate`
                  : `/capture/${capture.id}/start`
              }
            >
              Go
            </Link>
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
