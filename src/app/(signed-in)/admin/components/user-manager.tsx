"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ChevronRight, Search } from "lucide-react";
import { ManageableUser } from "./types";
import { useCallback, useMemo, useState, useEffect } from "react";
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
import Link from "next/link";
import { Input, InputIcon, InputRoot } from "@/components/ui/input-icon";
import { useDebounce } from "@uidotdev/usehooks";

export function UserManager({ users }: { users: ManageableUser[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchUser, setSearchUser] = useState("");
  const [showPageInput, setShowPageInput] = useState(false);
  const [inputPage, setInputPage] = useState("");
  const debouncedSearch = useDebounce(searchUser, 400);
  const itemsPerPage = 10;

  const validUsers = users.filter(
    (user) => user.name !== null && user.email !== null
  );

  const filteredUsers = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return validUsers;
    }

    const searchTerm = debouncedSearch.toLowerCase().trim();
    return validUsers.filter((user) => {
      const name = user.name?.toLowerCase() || "";
      const email = user.email?.toLowerCase() || "";
      return name.includes(searchTerm) || email.includes(searchTerm);
    });
  }, [validUsers, debouncedSearch]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage]);

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  // Reset to first page when search changes
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
            Manage platform users and their roles.
          </p>
          {debouncedSearch && (
            <p className="text-sm text-muted-foreground mt-1">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}{" "}
              found
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
      {/* Users Table */}
      <div className="rounded-xl bg-muted/10 p-4">
        <Table>
          <TableHeader>
            <TableRow className="border-none">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/10 border-0">
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Link href={`/admin/user/${user.id}`}>
                    <Button className="hover">
                      Go to User <ChevronRight />
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
