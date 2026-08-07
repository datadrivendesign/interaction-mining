"use client";

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
import { useCallback, useState } from "react";
import { Input } from "./input";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * AdminPagination provides pagination controls for admin tables with page input support
 * @param currentPage - Current active page number
 * @param totalPages - Total number of pages
 * @param onPageChange - Callback when user acts and makes a page number change
 * @returns AdminPagination component
 */
export function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
}: AdminPaginationProps) {
  // calculate number of pages to show in pagination
  const getPageNumbers = useCallback(() => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  const [showJumpToPageInput, setShowJumpToPageInput] = useState(false);
  const [showJumpToEndInput, setShowJumpToEndInput] = useState(false);

  const [jumpToPageValue, setJumpToPageValue] = useState("");
  const [jumpToEndValue, setJumpToEndValue] = useState("");

  // handle user clicking previous page button in pagination
  const onPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  // handle user clicking first page button in pagination
  const onFirstPage = () => {
    onPageChange(1);
  };
  // handle user submit page input in starting pagination inputs
  const onJumpToPageSubmit = () => {
    const newPage = parseInt(jumpToPageValue);
    setShowJumpToPageInput(false);
    setJumpToPageValue("");
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  // handle user pressing enter or escape in starting pagination input
  const onJumpToPageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onJumpToPageSubmit();
    } else if (e.key === "Escape") {
      setShowJumpToPageInput(false);
      setJumpToPageValue("");
    }
  };
  // handle user clicking a page number in pagination
  const handlePageClick = (pageNum: number) => {
    onPageChange(pageNum);
  };
  // handle user submit page input in ending pagination inputs
  const onJumpToEndSubmit = () => {
    const newPage = parseInt(jumpToEndValue);
    setShowJumpToEndInput(false);
    setJumpToEndValue("");
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };
  // handle user clicking last page button in pagination
  const onLastPage = () => {
    onPageChange(totalPages);
  };
  // handle user clicking next page button in pagination
  const onNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  // handle user pressing enter or escape in ending pagination input
  const onJumpToEndKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onJumpToEndSubmit();
    } else if (e.key === "Escape") {
      setShowJumpToEndInput(false);
      setJumpToEndValue("");
    }
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            className={cn(currentPage === 1 && "cursor-default opacity-50")}
            onClick={onPreviousPage}
          />
        </PaginationItem>

        {!getPageNumbers().includes(1) && (
          <>
            <PaginationItem>
              <PaginationLink href="#" onClick={onFirstPage}>
                {1}
              </PaginationLink>
            </PaginationItem>
            {showJumpToPageInput ? (
              <PaginationItem>
                <Input
                  className="h-8 w-20 text-center"
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpToPageValue}
                  onChange={(e) => setJumpToPageValue(e.target.value)}
                  onKeyDown={onJumpToPageKeyDown}
                  onBlur={onJumpToPageSubmit}
                  autoFocus
                  placeholder="Page"
                />
              </PaginationItem>
            ) : (
              <PaginationItem>
                <PaginationEllipsis
                  onClick={() => {
                    setShowJumpToPageInput(true);
                    setJumpToPageValue(currentPage.toString());
                  }}
                  className="hover:bg-muted/50 cursor-pointer rounded"
                />
              </PaginationItem>
            )}
          </>
        )}

        {getPageNumbers().map((pageNum) => (
          <PaginationItem key={pageNum}>
            <PaginationLink
              href="#"
              isActive={currentPage === pageNum}
              onClick={() => {
                onPageChange(pageNum);
              }}
            >
              {pageNum}
            </PaginationLink>
          </PaginationItem>
        ))}

        {!getPageNumbers().includes(totalPages) && (
          <>
            {currentPage < totalPages && (
              <>
                {showJumpToEndInput ? (
                  <PaginationItem>
                    <Input
                      className="h-8 w-20 text-center"
                      type="number"
                      min="1"
                      max={totalPages}
                      value={jumpToEndValue}
                      onChange={(e) => setJumpToEndValue(e.target.value)}
                      onKeyDown={onJumpToEndKeyDown}
                      onBlur={onJumpToEndSubmit}
                      autoFocus
                      placeholder="Page"
                    />
                  </PaginationItem>
                ) : (
                  <PaginationItem>
                    <PaginationEllipsis
                      onClick={() => {
                        setShowJumpToEndInput(true);
                        setJumpToEndValue(currentPage.toString());
                      }}
                      className="hover:bg-muted/50 cursor-pointer rounded"
                    />
                  </PaginationItem>
                )}
              </>
            )}

            <PaginationItem>
              <PaginationLink href="#" onClick={onLastPage}>
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationNext
            className={cn(
              currentPage === totalPages && "cursor-default opacity-50",
            )}
            onClick={onNextPage}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
