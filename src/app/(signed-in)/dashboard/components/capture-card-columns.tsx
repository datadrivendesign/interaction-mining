"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, AlertCircle, Upload } from "lucide-react";
import { CaptureStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { toast } from "sonner";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  CapturesPaginatedOutput,
  deleteCaptureTask,
  getCapturesPaginated,
  revalidateCaptureCaches,
} from "@/lib/actions";
import { COLUMN_QUERY_STATUSES, statusConfig } from "./config";
import { CaptureCard } from "./capture-card";

type DashboardCapture = Prisma.CaptureGetPayload<{
  include: { app: true; task: true };
}>;
const VISIBLE_CAPTURE_STATUSES = [
  CaptureStatus.CREATED,
  CaptureStatus.PROCESSING,
  CaptureStatus.REVIEWING,
] as const;
type NonApprovedStatus = (typeof VISIBLE_CAPTURE_STATUSES)[number];

/** Which part of the In review column the worker is looking at. */
type ReviewFilter = "all" | "REVIEWING" | "REVIEWED";

const REVIEW_FILTERS: { value: ReviewFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: CaptureStatus.REVIEWING, label: "Waiting for reviewer" },
  { value: CaptureStatus.REVIEWED, label: "Waiting for final check" },
];

function queryStatusesFor(
  status: NonApprovedStatus,
  reviewFilter: ReviewFilter,
): CaptureStatus[] {
  if (status === CaptureStatus.REVIEWING && reviewFilter !== "all") {
    return [reviewFilter];
  }
  return COLUMN_QUERY_STATUSES[status];
}

function ReviewFilterChips({
  value,
  disabled,
  onChange,
}: {
  value: ReviewFilter;
  disabled: boolean;
  onChange: (value: ReviewFilter) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Filter captures in review"
      className="flex flex-wrap gap-1.5 pt-2"
    >
      {REVIEW_FILTERS.map((filter) => {
        const selected = filter.value === value;
        return (
          <Button
            key={filter.value}
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            className="h-7 rounded-full px-3 text-xs"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(filter.value)}
          >
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}

export function CaptureColumn({
  handleLoadMore,
  status,
  config,
  columnData,
  onDelete,
  deletingIds,
  filters,
}: {
  handleLoadMore: (status: NonApprovedStatus) => void;
  status: NonApprovedStatus;
  config: (typeof statusConfig)[NonApprovedStatus];
  columnData: DashboardCapturesPaginatedOutput & { loading: boolean };
  onDelete: (id: string) => Promise<void>;
  deletingIds: Set<string>;
  /** Optional filter chips, shown under the column description. */
  filters?: React.ReactNode;
}) {
  const Icon = config.icon;

  return (
    <Card key={status} className="flex min-w-0 flex-col">
      <CardHeader className="px-4 pb-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className={`size-5 shrink-0 ${config.textColor}`} />
            <h3 className="min-w-0 truncate font-semibold">{config.label}</h3>
            <Badge variant="secondary" className="shrink-0">
              {columnData.items.length}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
        {filters}
      </CardHeader>
      <CardContent className="px-4 pt-0 lg:max-h-[65vh] lg:overflow-y-auto">
        {columnData.items.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="space-y-3">
              {columnData.items.map((capture) => (
                <CaptureCard
                  key={capture.id}
                  capture={capture}
                  status={capture.status}
                  onDelete={onDelete}
                  isDeleting={deletingIds.has(capture.id)}
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
          <div className="flex items-center justify-center py-8 text-center text-muted-foreground">
            <AlertCircle className="mr-2 size-4 shrink-0" />
            <span>No {config.label.toLowerCase()} captures</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type DashboardCapturesPaginatedOutput = Omit<
  CapturesPaginatedOutput,
  "items"
> & {
  items: DashboardCapture[];
};
type ColumnsState = Record<
  NonApprovedStatus,
  DashboardCapturesPaginatedOutput & { loading: boolean }
>;

function sortCaptureItemsNewestFirst<T extends { id: string }>(
  items: T[],
): T[] {
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
  const router = useRouter();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const [columns, setColumns] = useState<ColumnsState>(() => {
    const entries = Object.entries(initialCapturesByStatus).map(([k, v]) => [
      k as NonApprovedStatus,
      {
        ...v,
        items: normalizeCaptureItems(v.items as DashboardCapture[]),
        loading: false,
      },
    ]);
    return Object.fromEntries(entries) as ColumnsState;
  });

  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  // Ignores a filter response that arrives after a newer filter was chosen.
  const reviewFilterRequestRef = useRef(0);

  const handleReviewFilterChange = async (next: ReviewFilter) => {
    if (next === reviewFilter) {
      return;
    }
    const status = CaptureStatus.REVIEWING;
    const requestId = ++reviewFilterRequestRef.current;
    setReviewFilter(next);
    setColumns((prev) => ({
      ...prev,
      [status]: { ...prev[status], loading: true },
    }));
    const res = await getCapturesPaginated({
      userId,
      status: queryStatusesFor(status, next),
      limit: 10,
      includes: { app: true, task: true },
    });
    if (requestId !== reviewFilterRequestRef.current) {
      return;
    }
    if (!res.ok || !res.data) {
      toast.error("Could not load captures. Try again.");
      setColumns((prev) => ({
        ...prev,
        [status]: { ...prev[status], loading: false },
      }));
      return;
    }
    const { items, nextCursor, hasNextPage } = res.data;
    setColumns((prev) => ({
      ...prev,
      [status]: {
        items: normalizeCaptureItems(items as DashboardCapture[]),
        nextCursor,
        hasNextPage,
        loading: false,
      },
    }));
  };

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
      status: queryStatusesFor(status, reviewFilter),
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
        items: normalizeCaptureItems([
          ...prev[status].items,
          ...(items as DashboardCapture[]),
        ]),
        nextCursor,
        hasNextPage,
        loading: false,
      },
    }));
  };

  const handleDelete = async (id: string) => {
    if (deletingIds.has(id)) {
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(id));
    const result = await deleteCaptureTask(id);

    if (!result.ok) {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.error(result.message || "Failed to delete capture.");
      return;
    }

    setColumns((prev) => {
      const next = { ...prev };
      for (const status of Object.keys(next) as NonApprovedStatus[]) {
        next[status] = {
          ...next[status],
          items: next[status].items.filter((capture) => capture.id !== id),
        };
      }
      return next;
    });

    try {
      await revalidateCaptureCaches();
      router.refresh();
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)_minmax(0,0.95fr)]">
      {VISIBLE_CAPTURE_STATUSES.map((status) => {
        const config = statusConfig[status];
        const column = columns[status];
        return (
          <CaptureColumn
            key={status}
            status={status}
            config={config}
            columnData={column}
            handleLoadMore={handleLoadMore}
            onDelete={(id) => handleDelete(id)}
            deletingIds={deletingIds}
            filters={
              status === CaptureStatus.REVIEWING ? (
                <ReviewFilterChips
                  value={reviewFilter}
                  disabled={column.loading}
                  onChange={(next) => void handleReviewFilterChange(next)}
                />
              ) : undefined
            }
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
        <Upload className="mb-4 size-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No captures yet</h3>
        <p className="mb-4 text-muted-foreground">
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
