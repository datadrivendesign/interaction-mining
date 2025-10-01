"use client";

import {
  Table,
  TableCell,
  TableRow,
  TableBody,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaptureAdminView } from "@/lib/actions";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useDebounce } from "@uidotdev/usehooks";
import { Input, InputIcon, InputRoot } from "@/components/ui/input-icon";

export function ReviewPending({ captures }: { captures: CaptureAdminView[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchUser, setSearchUser] = useState("");
  const [showPageInput, setShowPageInput] = useState(false);
  const [inputPage, setInputPage] = useState("");
  const debouncedSearch = useDebounce(searchUser, 400);
  const itemsPerPage = 10;

  const validCaptures = captures.filter(
    (capture) => capture.user?.name !== null && capture.user?.email !== null
  );

  const filteredCaptures = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return validCaptures;
    }

    const searchTerm = debouncedSearch.toLowerCase().trim();
    return validCaptures.filter((capture) => {
      const name = capture.user?.name?.toLowerCase() || "";
      const email = capture.user?.email?.toLowerCase() || "";
      return name.includes(searchTerm) || email.includes(searchTerm);
    });
  }, [validCaptures, debouncedSearch]);

  const totalPages = Math.ceil(filteredCaptures.length / itemsPerPage);

  const paginatedCaptures = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredCaptures.slice(start, end);
  }, [filteredCaptures, currentPage]);

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Handle page input submission
  const handlePageInputSubmit = () => {
    const page = parseInt(inputPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setShowPageInput(false);
    setInputPage("");
  };

  // Handle page input key events
  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePageInputSubmit();
    } else if (e.key === "Escape") {
      setShowPageInput(false);
      setInputPage("");
    }
  };

  return (
    <>
      <div className="space-y-4 flex justify-between">
        <div>
          <p className="text-muted-foreground text-start mt-1">
            Review pending captures.
          </p>
          {debouncedSearch && (
            <p className="text-sm text-muted-foreground mt-1">
              {filteredCaptures.length} capture
              {filteredCaptures.length !== 1 ? "s" : ""} found
              {debouncedSearch && ` for "${debouncedSearch}"`}
            </p>
          )}
        </div>
        <InputRoot className="w-96">
          <InputIcon>
            <Search size={20} className="text-muted-foreground" />
          </InputIcon>
          <Input
            placeholder="Search by name or email"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
          />
        </InputRoot>
      </div>
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

          {!getPageNumbers().includes(totalPages) && (
            <>
              {currentPage < totalPages && (
                <>
                  {showPageInput ? (
                    <PaginationItem>
                      <Input
                        className="w-12 h-8 text-center"
                        type="number"
                        min="1"
                        max={totalPages}
                        value={inputPage}
                        onChange={(e) => setInputPage(e.target.value)}
                        onKeyDown={handlePageInputKeyDown}
                        onBlur={handlePageInputSubmit}
                        autoFocus
                        placeholder="Page"
                      />
                    </PaginationItem>
                  ) : (
                    <PaginationItem>
                      <PaginationEllipsis
                        onClick={() => {
                          setShowPageInput(true);
                          setInputPage(currentPage.toString());
                        }}
                        className="cursor-pointer hover:bg-muted/50 rounded"
                      />
                    </PaginationItem>
                  )}
                </>
              )}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
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
