"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, AlertCircle, Upload } from "lucide-react";
import { CaptureStatus } from "@prisma/client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Capture,
  deleteCaptureTask,
  revalidateCaptureCaches,
} from "@/lib/actions";
import { statusConfig } from "./config";
import { CaptureCard } from "./capture-card";

export function CaptureCardColumns({
  capturesByStatus,
}: {
  capturesByStatus: Record<CaptureStatus, Capture[]>;
}) {
  const handleDelete = (id: string) => {
    deleteCaptureTask(id);
    revalidateCaptureCaches();
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {Object.entries(statusConfig)
        .filter(([status]) => status !== CaptureStatus.APPROVED)
        .map(([status, config]) => {
          const statusCaptures =
            capturesByStatus[status as CaptureStatus] || [];
          const Icon = config.icon;
          return (
            <Card key={status} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`size-5 ${config.textColor}`} />
                    <h3 className="font-semibold">{config.label}</h3>
                    <Badge variant="secondary" className="ml-2">
                      {statusCaptures.length}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {statusCaptures.length > 0 ? (
                  <div className="space-y-3">
                    {statusCaptures.map((capture) => (
                      <CaptureCard
                        key={capture.id}
                        capture={capture}
                        status={status as CaptureStatus}
                        onDelete={(id) => handleDelete(id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <AlertCircle className="mr-2 size-4" />
                    No {config.label.toLowerCase()} captures
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
    </div>
  );
}

export function NoCapturesCard() {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <Upload className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No captures yet</h3>
        <p className="text-muted-foreground mb-4">
          Start by creating your first capture to begin contributing to the
          dataset.
        </p>
        <Link href="/capture/new">
          <Button>
            <Plus className="mr-2 size-4" /> Create First Capture
          </Button>
        </Link>
      </div>
    </Card>
  );
}
