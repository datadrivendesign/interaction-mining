"use client";

import {
  Table,
  TableCell,
  TableRow,
  TableBody,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CaptureAdminView } from "@/lib/actions";
import Link from "next/link";

/**
 * TasksTable displays a table of review tasks with user and app information
 * @param captures - Array of captures to display
 * @param handleTableUserClick - Callback when user is clicked
 * @param handleTableAppClick - Callback when app is clicked
 * @returns TasksTable component
 */
export function TasksTable({
  captures,
  handleTableUserClick,
  handleTableAppClick,
}: {
  captures: CaptureAdminView[];
  handleTableUserClick: (capture: CaptureAdminView) => void;
  handleTableAppClick: (capture: CaptureAdminView) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-none">
          <TableHead className="text-muted-foreground">Name</TableHead>
          <TableHead className="text-muted-foreground">Email</TableHead>
          <TableHead className="text-muted-foreground">App</TableHead>
          <TableHead className="text-muted-foreground">Review Task</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {captures.map((capture) => (
          <TableRow key={capture.id} className="hover:bg-muted/10 border-0">
            <TableCell className="font-medium">
              <Button
                variant="outline"
                className="hover p-2 cursor-pointer"
                onClick={() => handleTableUserClick(capture)}
              >
                {capture.user?.name ?? "Unknown"}
              </Button>
            </TableCell>
            <TableCell>
              <Link href={`/admin/users/${capture.user?.id}`}>
                <Button
                  variant="link"
                  className="hover:bg-transparent p-2 cursor-pointer"
                >
                  {capture.user?.email ?? "Unknown"}
                </Button>
              </Link>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                className="hover p-2 cursor-pointer"
                onClick={() => handleTableAppClick(capture)}
              >
                {capture.app.metadata.name}
              </Button>
            </TableCell>
            <TableCell>
              <Link href={`/capture/${capture.id}/evaluate`}>
                <Button className="hover p-2 cursor-pointer">
                  {capture.task.description}
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
