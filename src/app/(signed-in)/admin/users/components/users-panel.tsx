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
import { Loader2 } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input-icon";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getFilterOptionsForUsers,
  getUsersCount,
  getUsersForAdmin,
  ManageableUser,
} from "../../util";
import { FilterUser } from "./filter-user";
import { Badge } from "@/components/ui/badge";
import { Role } from "@prisma/client";
import { ComboboxOption } from "../../util/combobox";

function UsersTable({
  users,
  handleTableUserClick,
}: {
  users: ManageableUser[];
  handleTableUserClick: (user: ManageableUser) => void;
}) {
  return (
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
        {users.map((user) => (
          <TableRow key={user.id} className="hover:bg-muted/10 border-0">
            <TableCell className="font-medium">
              <Button
                variant="outline"
                className="hover p-2 cursor-pointer"
                onClick={() => handleTableUserClick(user)}
              >
                {user.name}
              </Button>
            </TableCell>
            <TableCell>
              <Link href={`/admin/users/${user.id}`}>
                <Button
                  variant="link"
                  className="hover:bg-transparent p-2 cursor-pointer"
                >
                  {user.email}
                </Button>
              </Link>
            </TableCell>
            <TableCell>
              <Badge
                variant={user.role === Role.ADMIN ? "secondary" : "default"}
                className={
                  user.role === Role.ADMIN
                    ? "bg-green-500 text-white dark:bg-green-600"
                    : ""
                }
              >
                {user.role}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const constructUserPanelURL = (
  page: number,
  users: string[],
  role: Role | ""
) => {
  const queryParams = new URLSearchParams();
  queryParams.set("page", page.toString());
  if (users.length > 0) {
    queryParams.set("users", users.join(","));
  }
  if (role !== "") {
    queryParams.set("role", role);
  }
  return `/admin/users?${queryParams.toString()}`;
};

export function UsersPanel() {
  // constants
  const itemsPerPage = 10;

  // get url parameters for retrieval
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page") || "1")
    : 1;

  // handle loading state
  const [loading, setLoading] = useState(false);

  // retrieve data from server
  const [users, setUsers] = useState<ManageableUser[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  // keep track of filtered users
  const [usersList, setUsersList] = useState<ComboboxOption[]>([]);
  const [usersFiltered, setUsersFiltered] = useState<ComboboxOption[]>([]);
  // keep track of filtered roles
  const [roleFiltered, setRoleFiltered] = useState<Role | "">("");

  // handle fetching filter options from server
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const filterOptionsRes = await getFilterOptionsForUsers();
      if (filterOptionsRes.ok) {
        const usersData = filterOptionsRes.data ?? [];
        const usersOptions = usersData.map((user) => ({
          value: user.id,
          label: user.name ?? user.email ?? "Unknown",
        }));
        setUsersList(usersOptions);
      } else {
        console.error(
          "Failed to fetch filter options:",
          filterOptionsRes.message
        );
      }
    };
    fetchFilterOptions();
  }, [searchParams]);

  // handle updating filtered objects from url parameters
  useEffect(() => {
    const usersIds = searchParams.get("users")
      ? searchParams.get("users")?.split(",")
      : [];
    setUsersFiltered(
      usersList.filter((user) => usersIds?.includes(user.value))
    );
    const role = (searchParams.get("role") ?? "") as Role | "";
    setRoleFiltered(role);
  }, [usersList, searchParams]);

  // handle fetching users from server based on filters
  useEffect(() => {
    const userIds = searchParams.get("users")
      ? searchParams.get("users")?.split(",")
      : [];
    const role = (searchParams.get("role") ?? undefined) as Role | undefined;

    const fetchUsers = async () => {
      setLoading(true);
      const [usersRes, usersCountRes] = await Promise.all([
        getUsersForAdmin({
          limit: itemsPerPage,
          page: page,
          userIds: userIds,
          role: role,
        }),
        getUsersCount({
          userIds,
          role: role,
        }),
      ]);

      if (usersRes.ok) {
        setUsers(usersRes.data ?? []);
      }
      if (usersCountRes.ok) {
        setUsersCount(usersCountRes.data ?? 0);
      }

      if (!usersRes.ok) {
        console.error("Failed to fetch users:", usersRes.message);
      }
      if (!usersCountRes.ok) {
        console.error("Failed to fetch users count:", usersCountRes.message);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [page, itemsPerPage, searchParams]);

  const validUsers = users.filter(
    (user) => user.name !== null && user.email !== null
  );

  // pagination logic
  const totalPages = Math.ceil(usersCount / itemsPerPage);

  const [showInputPaginationStart, setShowInputPaginationStart] =
    useState(false);
  const [showInputPaginationEnd, setShowInputPaginationEnd] = useState(false);

  const [inputPaginationStart, setInputPaginationStart] = useState("");
  const [inputPaginationEnd, setInputPaginationEnd] = useState("");

  // calculate number of pages to show in pagination
  const getPageNumbers = useCallback(() => {
    const pages = [];
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  // handle user submit page input in starting pagination inputs
  const handlePaginationStartInputSubmit = () => {
    const newPage = parseInt(inputPaginationStart);
    setShowInputPaginationStart(false);
    setInputPaginationStart("");
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      router.push(
        constructUserPanelURL(
          newPage,
          usersFiltered.map((user) => user.value),
          roleFiltered
        )
      );
    }
  };

  // handle user pressing enter or escape in starting pagination input
  const handlePaginationStartInputKeyDown = (e: React.KeyboardEvent) => {
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handlePaginationStartInputSubmit();
      } else if (e.key === "Escape") {
        setShowInputPaginationStart(false);
        setInputPaginationStart("");
      }
    };
  };

  // handle user submit page input in ending pagination inputs
  const handlePaginationEndInputSubmit = () => {
    const newPage = parseInt(inputPaginationEnd);
    setShowInputPaginationEnd(false);
    setInputPaginationEnd("");
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      router.push(
        constructUserPanelURL(
          newPage,
          usersFiltered.map((user) => user.value),
          roleFiltered
        )
      );
    }
  };

  // handle user pressing enter or escape in ending pagination input
  const handlePaginationEndInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePaginationEndInputSubmit();
    } else if (e.key === "Escape") {
      setShowInputPaginationEnd(false);
      setInputPaginationEnd("");
    }
  };

  // handle filter logic
  const handleUserFilterSelect = (option: ComboboxOption) => {
    const newUsersFiltered = [...usersFiltered, option];
    setUsersFiltered(newUsersFiltered);
    router.push(
      constructUserPanelURL(
        page,
        newUsersFiltered.map((user) => user.value),
        roleFiltered
      )
    );
  };

  const handleUserFilterRemove = (option: ComboboxOption) => {
    const newUsersFiltered = usersFiltered.filter(
      (user) => user.value !== option.value
    );
    setUsersFiltered(newUsersFiltered);
    router.push(
      constructUserPanelURL(
        page,
        newUsersFiltered.map((user) => user.value),
        roleFiltered
      )
    );
  };

  // handle role filter logic
  const handleRoleFilterSelect = (option: ComboboxOption) => {
    const newSelectedRole = option.value as Role | "";
    setRoleFiltered(newSelectedRole);
    router.push(
      constructUserPanelURL(
        page,
        usersFiltered.map((user) => user.value),
        newSelectedRole
      )
    );
  };

  // handle clear filters logic
  const handleClearFilters = () => {
    setUsersFiltered([]);
    setRoleFiltered("");
    router.push(constructUserPanelURL(page, [], ""));
  };

  // handle logic for users shown in table
  const handleTableUserClick = (user: ManageableUser) => {
    if (
      user.id &&
      user.name &&
      usersFiltered.every(
        (filteredUser: ComboboxOption) => filteredUser.value !== user.id
      )
    ) {
      handleUserFilterSelect({
        value: user.id,
        label: user.name,
      });
    }
  };

  return (
    <>
      <div className="justify-between">
        <p className="text-start mt-1 text-lg font-bold tracking-tight">
          Users Fetched{" "}
          <span className="text-muted-foreground">({usersCount})</span>
        </p>
        <FilterUser
          usersList={usersList}
          usersFiltered={usersFiltered}
          roleFiltered={roleFiltered}
          handleUserFilterSelect={handleUserFilterSelect}
          handleUserFilterRemove={handleUserFilterRemove}
          handleRoleFilterSelect={handleRoleFilterSelect}
          handleClearFilters={handleClearFilters}
        />
      </div>
      {/* Users Table */}
      <div className="rounded-xl bg-muted/10 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : (
          <UsersTable
            users={validUsers}
            handleTableUserClick={handleTableUserClick}
          />
        )}
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={cn(page === 1 && "opacity-50 cursor-default")}
              onClick={() => {
                if (page > 1) {
                  router.push(
                    constructUserPanelURL(
                      page - 1,
                      usersFiltered.map((user) => user.value),
                      roleFiltered
                    )
                  );
                }
              }}
            />
          </PaginationItem>

          {!getPageNumbers().includes(1) && (
            <>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={() => {
                    router.push(
                      constructUserPanelURL(
                        1,
                        usersFiltered.map((user) => user.value),
                        roleFiltered
                      )
                    );
                  }}
                >
                  {1}
                </PaginationLink>
              </PaginationItem>
              {showInputPaginationStart ? (
                <PaginationItem>
                  <Input
                    className="w-20 h-8 text-center"
                    type="number"
                    min="1"
                    max={totalPages}
                    value={inputPaginationStart}
                    onChange={(e) => setInputPaginationStart(e.target.value)}
                    onKeyDown={handlePaginationStartInputKeyDown}
                    onBlur={handlePaginationStartInputSubmit}
                    autoFocus
                    placeholder="Page"
                  />
                </PaginationItem>
              ) : (
                <PaginationItem>
                  <PaginationEllipsis
                    onClick={() => {
                      setShowInputPaginationStart(true);
                      setInputPaginationStart(page.toString());
                    }}
                    className="cursor-pointer hover:bg-muted/50 rounded"
                  />
                </PaginationItem>
              )}
            </>
          )}

          {getPageNumbers().map((pageNum) => (
            <PaginationItem key={pageNum}>
              <PaginationLink
                href="#"
                isActive={page === pageNum}
                onClick={() => {
                  router.push(
                    constructUserPanelURL(
                      pageNum,
                      usersFiltered.map((user) => user.value),
                      roleFiltered
                    )
                  );
                }}
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          ))}

          {!getPageNumbers().includes(totalPages) && (
            <>
              {page < totalPages && (
                <>
                  {showInputPaginationEnd ? (
                    <PaginationItem>
                      <Input
                        className="w-20 h-8 text-center"
                        type="number"
                        min="1"
                        max={totalPages}
                        value={inputPaginationEnd}
                        onChange={(e) => setInputPaginationEnd(e.target.value)}
                        onKeyDown={handlePaginationEndInputKeyDown}
                        onBlur={handlePaginationEndInputSubmit}
                        autoFocus
                        placeholder="Page"
                      />
                    </PaginationItem>
                  ) : (
                    <PaginationItem>
                      <PaginationEllipsis
                        onClick={() => {
                          setShowInputPaginationEnd(true);
                          setInputPaginationEnd(page.toString());
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
                  onClick={() => {
                    router.push(
                      constructUserPanelURL(
                        totalPages,
                        usersFiltered.map((user) => user.value),
                        roleFiltered
                      )
                    );
                  }}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              className={cn(page === totalPages && "opacity-50 cursor-default")}
              onClick={() => {
                if (page < totalPages) {
                  router.push(
                    constructUserPanelURL(
                      page + 1,
                      usersFiltered.map((user) => user.value),
                      roleFiltered
                    )
                  );
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
}
