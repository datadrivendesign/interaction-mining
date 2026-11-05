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
 * @param showWorker - Show worker name and email (admin only)
 * @param handleTableUserClick - Callback when user is clicked
 * @param handleTableAppClick - Callback when app is clicked
 * @returns TasksTable component
 */
export function TasksTable({
  captures,
  stage,
  showWorker,
  handleTableUserClick,
  handleTableAppClick,
}: {
  captures: TaskRow[];
  stage: TaskStage;
  showWorker: boolean;
  handleTableUserClick: (capture: TaskRow) => void;
  handleTableAppClick: (capture: TaskRow) => void;
}) {
  const head = "text-muted-foreground";
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-none">
          {showWorker && <TableHead className={head}>Name</TableHead>}
          {showWorker && <TableHead className={head}>Email</TableHead>}
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
        </TableRow>
      </TableHeader>

      <TableBody>
        {captures.map((capture) => (
          <TableRow key={capture.id} className="hover:bg-muted/10 border-0">
            {showWorker && (
              <TableCell className="font-medium">
                <Button
                  variant="outline"
                  className="hover cursor-pointer p-2"
                  onClick={() => handleTableUserClick(capture)}
                >
                  {capture.user?.name ?? "Unknown"}
                </Button>
              </TableCell>
            )}
            {showWorker && (
              <TableCell>
                {capture.user?.email ? (
                  <Link
                    href={`/admin/users/${capture.user.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="link"
                      className="cursor-pointer p-2 hover:bg-transparent"
                    >
                      {capture.user.email}
                    </Button>
                  </Link>
                ) : (
                  <span className="p-2 text-sm text-muted-foreground">
                    Unknown
                  </span>
                )}
              </TableCell>
            )}
            <TableCell>
              <Button
                variant="outline"
                className="hover cursor-pointer p-2"
                onClick={() => handleTableAppClick(capture)}
              >
                {capture.app.metadata.name}
              </Button>
            </TableCell>
            <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
              {formatCaptureTimestampFromObjectId(capture.id) ?? "Unknown"}
            </TableCell>
            <TableCell>
              {stage === "SENT_BACK" ? (
                // The worker holds it; the evaluate page opens again once
                // they finish.
                <span className="text-sm">{capture.task.description}</span>
              ) : (
                <Link
                  href={`/capture/${capture.id}/evaluate`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="hover cursor-pointer p-2">
                    {capture.task.description}
                  </Button>
                </Link>
              )}
            </TableCell>
            {stage === "SENT_BACK" ? (
              <>
                <TableCell className="text-sm tabular-nums">
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
              <TableCell className="text-sm tabular-nums">
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
