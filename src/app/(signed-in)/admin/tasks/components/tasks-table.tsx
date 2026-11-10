"use client";

import {
  Table,
  TableCell,
  TableRow,
  TableBody,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ListFilter } from "lucide-react";
import { ReviewStage } from "@prisma/client";
import { formatCaptureTimestampFromObjectId } from "@/lib/utils/capture-timestamp";
import Link from "next/link";
import { TaskRow, TaskStage } from "../../util";

const STAGE_LABEL: Record<ReviewStage, string> = {
  REVIEWER: "Reviewer",
  FINAL: "Final check",
};

/**
 * TasksTable displays one page of a review queue.
 * @param captures - Rows to display
 * @param stage - Which queue; decides the review-log columns
 * @param showWorkerEmail - Show the worker's email (admin only; the name
 *   column shows for everyone who can open the queue)
 * @param handleTableUserClick - Callback when user is clicked
 * @param handleTableAppClick - Callback when app is clicked
 * @returns TasksTable component
 */
export function TasksTable({
  captures,
  stage,
  showWorkerEmail,
  handleTableUserClick,
  handleTableAppClick,
}: {
  captures: TaskRow[];
  stage: TaskStage;
  showWorkerEmail: boolean;
  handleTableUserClick: (capture: TaskRow) => void;
  handleTableAppClick: (capture: TaskRow) => void;
}) {
  const head =
    "text-xs font-semibold tracking-wide text-muted-foreground uppercase";
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-none">
          <TableHead className={head}>Name</TableHead>
          {showWorkerEmail && <TableHead className={head}>Email</TableHead>}
          <TableHead className={head}>App</TableHead>
          <TableHead className={head}>Created</TableHead>
          <TableHead className={head}>Task</TableHead>
          {stage === "SENT_BACK" ? (
            <>
              <TableHead className={head}>Times sent back</TableHead>
              <TableHead className={head}>Sent back by</TableHead>
            </>
          ) : (
            <TableHead className={head}>Attempt</TableHead>
          )}
          {stage === "REVIEWED" && (
            <TableHead className={head}>Approved by</TableHead>
          )}
          <TableHead className={head}>
            <span className="sr-only">Notes</span>
          </TableHead>
          <TableHead className={head}>
            <span className="sr-only">Open</span>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {captures.map((capture) => (
          <TableRow key={capture.id} className="hover:bg-muted/10 border-0">
            <TableCell>
              <FilterLink
                label={capture.user?.name ?? "Unknown"}
                title="Filter by this worker"
                onClick={() => handleTableUserClick(capture)}
              />
            </TableCell>
            {showWorkerEmail && (
              <TableCell>
                {capture.user?.email ? (
                  <Link
                    href={`/admin/users/${capture.user.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    title="Open this worker's captures"
                  >
                    {capture.user.email}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">Unknown</span>
                )}
              </TableCell>
            )}
            <TableCell>
              <FilterLink
                label={capture.app.metadata.name}
                title="Filter by this app"
                onClick={() => handleTableAppClick(capture)}
              />
            </TableCell>
            <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
              {formatCaptureTimestampFromObjectId(capture.id) ?? "Unknown"}
            </TableCell>
            <TableCell className="min-w-48 whitespace-normal">
              {/* Long tasks clamp to two lines; hover shows all of it. */}
              <span
                className="line-clamp-2 max-w-md text-sm font-semibold text-foreground"
                title={capture.task.description}
              >
                {capture.task.description}
              </span>
            </TableCell>
            {stage === "SENT_BACK" ? (
              <>
                <TableCell className="text-sm font-medium tabular-nums">
                  {capture.review.timesSentBack}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {capture.review.lastBy ?? "Unknown"}
                  {capture.review.lastStage && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {STAGE_LABEL[capture.review.lastStage]}
                    </span>
                  )}
                </TableCell>
              </>
            ) : (
              <TableCell className="text-sm font-medium tabular-nums">
                {capture.review.attempt}
              </TableCell>
            )}
            {stage === "REVIEWED" && (
              <TableCell className="text-sm whitespace-nowrap">
                {capture.review.lastBy ?? "Unknown"}
              </TableCell>
            )}
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {capture.isOwn && <Badge variant="secondary">Yours</Badge>}
                {capture.review.selfReviewed && (
                  <Badge
                    variant="outline"
                    title="The reviewer recorded this capture"
                  >
                    Self-reviewed
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              {/* Sent back captures are with the worker; the evaluate page
                  opens again once they finish. */}
              {stage !== "SENT_BACK" && (
                <Button size="sm" asChild>
                  <Link
                    href={`/capture/${capture.id}/evaluate`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                    <ExternalLink className="size-3.5" aria-hidden />
                  </Link>
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** A table value that adds a filter when clicked. */
function FilterLink({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="focus-visible:ring-ring inline-flex max-w-48 cursor-pointer items-center gap-1 rounded-sm text-left text-sm font-medium underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="truncate">{label}</span>
      <ListFilter
        className="size-3 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </button>
  );
}
