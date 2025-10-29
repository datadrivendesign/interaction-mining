"use client";

import { ComboboxOption } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { AdminPagination } from "@/components/ui/admin-pagination";
import { Loader2 } from "lucide-react";
import { CaptureAdminView } from "@/lib/actions";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  constructTaskPanelURL,
  getFilterOptionsForTasks,
  getReviewCapturesCount,
  getReviewingCaptures,
} from "../../util";
import { FilterTask } from "./filter-task";
import { TasksTable } from "./tasks-table";

/**
 * TasksPanel is the main panel for the tasks page
 * @returns TasksPanel component
 */
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

  // handle fetching filter options from server
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

  // handle updating filtered objects from url parameters
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

  // handle fetching captures from server based on filters
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

  // filter out captures with no user or email
  const validCaptures = captures.filter(
    (capture) => capture.user?.name !== null && capture.user?.email !== null
  );

  // pagination inputs for pagination component
  const totalPages = Math.ceil(reviewCapturesCount / itemsPerPage);
  // handle page change
  const handlePageChange = (page: number) => {
    router.push(
      constructTaskPanelURL(
        page,
        usersFiltered.map((user) => user.value),
        appsFiltered.map((app) => app.value)
      )
    );
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

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
}
