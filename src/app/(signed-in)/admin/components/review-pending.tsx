"use client";

import {
  Table,
  TableCell,
  TableRow,
  TableBody,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaptureAdminView } from "@/lib/actions";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export function ReviewPending({ captures }: { captures: CaptureAdminView[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const validCaptures = captures.filter(
    (capture) => capture.user?.name !== null && capture.user?.email !== null
  );
  const totalPages = Math.ceil(validCaptures.length / itemsPerPage);

  const paginatedCaptures = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return validCaptures.slice(start, end);
  }, [validCaptures, currentPage, setCurrentPage]);

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <>
      <p className="text-muted-foreground text-start mt-1">
        Review pending captures.
      </p>
      {/* Capture Table */}
      <div className="rounded-xl bg-muted/10 p-4">
        <Table>
          <TableHeader>
            <TableRow className="border-none">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">App</TableHead>
              <TableHead className="text-muted-foreground">Task</TableHead>
              <TableHead className="text-muted-foreground"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedCaptures.map((capture) => (
              <TableRow key={capture.id} className="hover:bg-muted/10 border-0">
                <TableCell className="font-medium">
                  {capture.user?.name ?? "Unknown"}
                </TableCell>
                <TableCell>{capture.user?.email ?? "Unknown"}</TableCell>
                <TableCell>{capture.app.metadata.name}</TableCell>
                <TableCell>{capture.task.description}</TableCell>
                <TableCell>
                  <Link href={`/capture/${capture.id}/evaluate`}>
                    <Button className="hover">
                      Go to Capture <ChevronRight />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={cn(currentPage === 1 && "opacity-50 cursor-default")}
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                }
              }}
            />
          </PaginationItem>

          {getPageNumbers().map((pageNum) => (
            <PaginationItem key={pageNum}>
              <PaginationLink
                href="#"
                isActive={currentPage === pageNum}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          ))}

          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              className={cn(
                currentPage === totalPages && "opacity-50 cursor-default"
              )}
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(currentPage + 1);
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}
