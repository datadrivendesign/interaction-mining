"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, AlertCircle, Upload } from "lucide-react";
import { CaptureStatus } from "@prisma/client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  CapturesPaginatedOutput,
  deleteCaptureTask,
  getCapturesPaginated,
  revalidateCaptureCaches,
} from "@/lib/actions";
import { statusConfig } from "./config";
import { CaptureCard } from "./capture-card";

export function CaptureColumn({
  handleLoadMore,
  status,
  config,
  columnData,
  onDelete,
}: {
  handleLoadMore: (status: NonApprovedStatus) => void;
  status: NonApprovedStatus;
  config: any;
  columnData: CapturesPaginatedOutput & { loading: boolean };
  onDelete: (id: string) => void;
}) {
  const Icon = config.icon;

  return (
    <Card key={status} className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className={`size-5 ${config.textColor}`} />
            <h3 className="font-semibold">{config.label}</h3>
            <Badge variant="secondary" className="ml-2">
              {columnData.items.length}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </CardHeader>
      <CardContent className="pt-0 overflow-y-auto max-h-[65vh]">
        {columnData.items.length > 0 ? (
          <div className="flex flex-col gap-3 justify-center items-center">
            <div className="space-y-3">
              {columnData.items.map((capture) => (
                <CaptureCard
                  key={capture.id}
                  capture={capture}
                  status={status as CaptureStatus}
                  onDelete={onDelete}
                />
              ))}
            </div>
            {columnData.hasNextPage && (
              <Button
                size="sm"
                variant="default"
                disabled={columnData.loading}
                aria-busy={columnData.loading}
                onClick={() => handleLoadMore(status)}
              >
                {columnData.loading ? "Loading..." : "Load more"}
              </Button>
            )}
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
}

type NonApprovedStatus = Exclude<
  keyof typeof CaptureStatus,
  "APPROVED" | "ARCHIVED"
>;
type ColumnsState = Record<
  NonApprovedStatus,
  CapturesPaginatedOutput & { loading: boolean }
>;

function sortCaptureItemsNewestFirst<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.id.localeCompare(a.id));
}

function normalizeCaptureItems<T extends { id: string }>(items: T[]): T[] {
  const deduped = new Map<string, T>();
  items.forEach((item) => deduped.set(item.id, item));
  return sortCaptureItemsNewestFirst(Array.from(deduped.values()));
}

export function CaptureCardColumns({
  userId,
  initialCapturesByStatus,
}: {
  userId: string;
  initialCapturesByStatus: Record<NonApprovedStatus, CapturesPaginatedOutput>;
}) {
  const [columns, setColumns] = useState<ColumnsState>(() => {
    const entries = Object.entries(initialCapturesByStatus).map(([k, v]) => [
      k as NonApprovedStatus,
      {
        ...v,
        items: normalizeCaptureItems(v.items),
        loading: false,
      },
    ]);
    return Object.fromEntries(entries) as ColumnsState;
  });

  const handleLoadMore = async (status: NonApprovedStatus) => {
    const column = columns[status];
    if (!column?.hasNextPage || column.loading) {
      return;
    }
    // set column loading and call server action to get more captures
    setColumns((prev) => ({
      ...prev,
      [status]: { ...prev[status], loading: true },
    }));
    const res = await getCapturesPaginated({
      userId,
      status: CaptureStatus[status],
      cursor: column.nextCursor,
      limit: 10,
      includes: { app: true, task: true },
    });
    // if error, set column loading to false and return
    if (!res.ok || !res.data) {
      setColumns((prev) => ({
        ...prev,
        [status]: { ...prev[status], loading: false },
      }));
      return;
    }
    // if success, update column with new captures
    const { items, nextCursor, hasNextPage } = res.data;
    setColumns((prev) => ({
      ...prev,
      [status]: {
        items: normalizeCaptureItems([...prev[status].items, ...items]),
        nextCursor,
        hasNextPage,
        loading: false,
      },
    }));
  };

  const handleDelete = (id: string) => {
    deleteCaptureTask(id);
    revalidateCaptureCaches();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {Object.entries(statusConfig)
        .filter(([status]) => status !== CaptureStatus.APPROVED)
        .map(([status, config]) => {
          const column = columns[status as NonApprovedStatus];
          return (
            <CaptureColumn
              key={status}
              status={status as NonApprovedStatus}
              config={config}
              columnData={column}
              handleLoadMore={handleLoadMore}
              onDelete={(id) => handleDelete(id)}
            />
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
