"use client";

import {
  Table,
  TableCell,
  TableRow,
  TableBody,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaptureAdminView } from "@/lib/actions";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input-icon";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getFilterOptionsForTasks,
  getReviewCapturesCount,
  getReviewingCaptures,
} from "../../util";
import { FilterTask } from "./filter-task";
import { ComboboxOption } from "../../util/combobox";
import { Separator } from "@/components/ui/separator";

function TasksTable({
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

// construct url
const constructTaskPanelURL = (
  page: number,
  users: string[],
  apps: string[]
) => {
  const queryParams = new URLSearchParams();
  queryParams.set("page", page.toString());
  if (users.length > 0) {
    queryParams.set("users", users.join(","));
  }
  if (apps.length > 0) {
    queryParams.set("apps", apps.join(","));
  }
  return `/admin/tasks?${queryParams.toString()}`;
};

export function TasksPanel() {
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
  const [captures, setCaptures] = useState<CaptureAdminView[]>([]);
  const [reviewCapturesCount, setReviewCapturesCount] = useState(0);
  const [appsList, setAppsList] = useState<ComboboxOption[]>([]);
  const [usersList, setUsersList] = useState<ComboboxOption[]>([]);
  // keep track of filtered apps and users
  const [appsFiltered, setAppsFiltered] = useState<ComboboxOption[]>([]);
  const [usersFiltered, setUsersFiltered] = useState<ComboboxOption[]>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const filterOptionsRes = await getFilterOptionsForTasks();
      if (filterOptionsRes.ok) {
        const appsData = filterOptionsRes.data?.apps ?? [];
        const usersData = filterOptionsRes.data?.users ?? [];
        const appsOptions = appsData.map((app) => ({
          value: app.id,
          label: app.metadata.name,
        }));
        const usersOptions = usersData.map((user) => ({
          value: user.id,
          label: user.name ?? user.email ?? "Unknown",
        }));
        setAppsList(appsOptions);
        setUsersList(usersOptions);
      } else {
        console.error(
          "Failed to fetch filter options:",
          filterOptionsRes.message
        );
      }
    };
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const userIds = searchParams.get("users")
      ? searchParams.get("users")?.split(",")
      : [];
    const appIds = searchParams.get("apps")
      ? searchParams.get("apps")?.split(",")
      : [];
    setUsersFiltered(usersList.filter((user) => userIds?.includes(user.value)));
    setAppsFiltered(appsList.filter((app) => appIds?.includes(app.value)));
  }, [usersList, appsList, searchParams]);

  useEffect(() => {
    const userIds = searchParams.get("users")
      ? searchParams.get("users")?.split(",")
      : [];

    const appIds = searchParams.get("apps")
      ? searchParams.get("apps")?.split(",")
      : [];

    const fetchReviewCaptures = async () => {
      setLoading(true);
      const [capturesRes, reviewCapturesCountRes] = await Promise.all([
        getReviewingCaptures({
          limit: itemsPerPage,
          page: page,
          userIds,
          appIds,
        }),
        getReviewCapturesCount({
          userIds,
          appIds,
        }),
      ]);

      if (capturesRes.ok) {
        setCaptures(capturesRes.data ?? []);
      }
      if (reviewCapturesCountRes.ok) {
        setReviewCapturesCount(reviewCapturesCountRes.data ?? 0);
      }

      if (!capturesRes.ok) {
        console.error("Failed to fetch captures:", capturesRes.message);
      }
      if (!reviewCapturesCountRes.ok) {
        console.error(
          "Failed to fetch review captures count:",
          reviewCapturesCountRes.message
        );
      }
      setLoading(false);
    };
    fetchReviewCaptures();
  }, [page, itemsPerPage, searchParams]);

  const validCaptures = captures.filter(
    (capture) => capture.user?.name !== null && capture.user?.email !== null
  );

  // pagination logic
  const totalPages = Math.ceil(reviewCapturesCount / itemsPerPage);

  const [showInputPaginationStart, setShowInputPaginationStart] =
    useState(false);
  const [showInputPaginationEnd, setShowInputPaginationEnd] = useState(false);

  const [inputPaginationStart, setInputPaginationStart] = useState("");
  const [inputPaginationEnd, setInputPaginationEnd] = useState("");

  const getPageNumbers = useCallback(() => {
    const pages = [];
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  const handlePaginationStartInputSubmit = () => {
    const newPage = parseInt(inputPaginationStart);
    setShowInputPaginationStart(false);
    setInputPaginationStart("");
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      router.push(
        constructTaskPanelURL(
          newPage,
          usersFiltered.map((user) => user.value),
          appsFiltered.map((app) => app.value)
        )
      );
    }
  };

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

  const handlePaginationEndInputSubmit = () => {
    const newPage = parseInt(inputPaginationEnd);
    setShowInputPaginationEnd(false);
    setInputPaginationEnd("");
    if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages) {
      router.push(
        constructTaskPanelURL(
          newPage,
          usersFiltered.map((user) => user.value),
          appsFiltered.map((app) => app.value)
        )
      );
    }
  };

  const handlePaginationEndInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePaginationEndInputSubmit();
    } else if (e.key === "Escape") {
      setShowInputPaginationEnd(false);
      setInputPaginationEnd("");
    }
  };

  // handle filter logic
  const handleAppFilterSelect = (option: ComboboxOption) => {
    const newAppsFiltered = [...appsFiltered, option];
    setAppsFiltered(newAppsFiltered);
    router.push(
      constructTaskPanelURL(
        page,
        usersFiltered.map((user) => user.value),
        newAppsFiltered.map((app) => app.value)
      )
    );
  };
  const handleUserFilterSelect = (option: ComboboxOption) => {
    const newUsersFiltered = [...usersFiltered, option];
    setUsersFiltered(newUsersFiltered);
    router.push(
      constructTaskPanelURL(
        page,
        newUsersFiltered.map((user) => user.value),
        appsFiltered.map((app) => app.value)
      )
    );
  };

  const handleAppFilterRemove = (option: ComboboxOption) => {
    const newAppsFiltered = appsFiltered.filter(
      (app) => app.value !== option.value
    );
    setAppsFiltered(newAppsFiltered);
    router.push(
      constructTaskPanelURL(
        1,
        usersFiltered.map((user) => user.value),
        newAppsFiltered.map((app) => app.value)
      )
    );
  };
  const handleUserFilterRemove = (option: ComboboxOption) => {
    const newUsersFiltered = usersFiltered.filter(
      (user) => user.value !== option.value
    );
    setUsersFiltered(newUsersFiltered);
    router.push(
      constructTaskPanelURL(
        1,
        newUsersFiltered.map((user) => user.value),
        appsFiltered.map((app) => app.value)
      )
    );
  };
  const handleClearFilters = () => {
    setAppsFiltered([]);
    setUsersFiltered([]);
    router.push(constructTaskPanelURL(1, [], []));
  };

  // handle logic for users and apps shown in table
  const handleTableUserClick = (capture: CaptureAdminView) => {
    if (
      capture.user?.id &&
      capture.user?.name &&
      usersFiltered.every(
        (user: ComboboxOption) => user.value !== capture?.user?.id
      )
    ) {
      handleUserFilterSelect({
        value: capture.user.id,
        label: capture.user.name,
      });
    }
  };

  const handleTableAppClick = (capture: CaptureAdminView) => {
    if (
      capture.app?.id &&
      capture.app?.metadata.name &&
      appsFiltered.every(
        (app: ComboboxOption) => app.value !== capture?.app?.id
      )
    ) {
      handleAppFilterSelect({
        value: capture.app.id,
        label: capture.app.metadata.name,
      });
    }
  };

  return (
    <>
      <div className="justify-between">
        <FilterTask
          appsList={appsList}
          usersList={usersList}
          appsFiltered={appsFiltered}
          usersFiltered={usersFiltered}
          handleAppFilterSelect={handleAppFilterSelect}
          handleUserFilterSelect={handleUserFilterSelect}
          handleAppFilterRemove={handleAppFilterRemove}
          handleUserFilterRemove={handleUserFilterRemove}
          handleClearFilters={handleClearFilters}
        />
      </div>
      <p className="text-start mt-1 text-md font-bold tracking-tight">
        Pending Task Submissions{" "}
        <span className="text-muted-foreground">({reviewCapturesCount})</span>
      </p>
      <Separator className="my-2" />
      {/* Capture Table */}
      <div className="rounded-xl bg-muted/10">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : (
          <TasksTable
            captures={validCaptures}
            handleTableUserClick={handleTableUserClick}
            handleTableAppClick={handleTableAppClick}
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
                    constructTaskPanelURL(
                      page - 1,
                      usersFiltered.map((user) => user.value),
                      appsFiltered.map((app) => app.value)
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
                      constructTaskPanelURL(
                        1,
                        usersFiltered.map((user) => user.value),
                        appsFiltered.map((app) => app.value)
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
                    constructTaskPanelURL(
                      pageNum,
                      usersFiltered.map((user) => user.value),
                      appsFiltered.map((app) => app.value)
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
                      constructTaskPanelURL(
                        totalPages,
                        usersFiltered.map((user) => user.value),
                        appsFiltered.map((app) => app.value)
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
                    constructTaskPanelURL(
                      page + 1,
                      usersFiltered.map((user) => user.value),
                      appsFiltered.map((app) => app.value)
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
