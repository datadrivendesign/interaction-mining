"use client";

import { ComboboxOption } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { AdminPagination } from "@/components/ui/admin-pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  constructTaskPanelURL,
  getFilterOptionsForTasks,
  getReviewCapturesCount,
  getReviewingCaptures,
  TaskRow,
  TaskStage,
} from "../../util";
import { FilterTask } from "./filter-task";
import { TasksTable } from "./tasks-table";

const STAGE_TABS: { value: TaskStage; label: string }[] = [
  { value: "REVIEWED", label: "Final check" },
  { value: "REVIEWING", label: "Waiting for reviewer" },
  { value: "SENT_BACK", label: "Sent back" },
];

function isTaskStage(value: string | null): value is TaskStage {
  return STAGE_TABS.some((tab) => tab.value === value);
}

/**
 * TasksPanel is the queue for /admin/tasks (admin, with stage tabs) and
 * /review/tasks (reviewers, REVIEWING only).
 * @param isAdmin Admins get the stage tabs; reviewers only see REVIEWING.
 * @param basePath The page this panel is on, for filter and page links.
 * @returns TasksPanel component
 */
export function TasksPanel({
  isAdmin,
  basePath,
}: {
  isAdmin: boolean;
  basePath: "/admin/tasks" | "/review/tasks";
}) {
  // constants
  const itemsPerPage = 10;

  // get url parameters for retrieval
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page") || "1")
    : 1;
  // The admin's queue opens on the final check; reviewers have one queue.
  const stageParam = searchParams.get("stage");
  const stage: TaskStage = !isAdmin
    ? "REVIEWING"
    : isTaskStage(stageParam)
      ? stageParam
      : "REVIEWED";

  // handle loading state
  const [loading, setLoading] = useState(false);

  // retrieve data from server
  const [captures, setCaptures] = useState<TaskRow[]>([]);
  const [reviewCapturesCount, setReviewCapturesCount] = useState(0);
  const [appsList, setAppsList] = useState<ComboboxOption[]>([]);
  const [usersList, setUsersList] = useState<ComboboxOption[]>([]);
  // keep track of filtered apps and users
  const [appsFiltered, setAppsFiltered] = useState<ComboboxOption[]>([]);
  const [usersFiltered, setUsersFiltered] = useState<ComboboxOption[]>([]);

  // handle fetching filter options from server
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const filterOptionsRes = await getFilterOptionsForTasks(stage);
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
          filterOptionsRes.message,
        );
      }
    };
    fetchFilterOptions();
  }, [stage]);

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
          stage,
        }),
        getReviewCapturesCount({
          userIds,
          appIds,
          stage,
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
          reviewCapturesCountRes.message,
        );
      }
      setLoading(false);
    };
    fetchReviewCaptures();
  }, [page, itemsPerPage, searchParams, stage]);

  // pagination inputs for pagination component
  const totalPages = Math.ceil(reviewCapturesCount / itemsPerPage);
  // handle page change
  const handlePageChange = (page: number) => {
    router.push(
      constructTaskPanelURL(
        basePath,
        page,
        usersFiltered.map((user) => user.value),
        appsFiltered.map((app) => app.value),
        stage,
      ),
    );
  };

  // handle filter logic
  const handleAppFilterSelect = (option: ComboboxOption) => {
    const newAppsFiltered = [...appsFiltered, option];
    setAppsFiltered(newAppsFiltered);
    router.push(
      constructTaskPanelURL(
        basePath,
        page,
        usersFiltered.map((user) => user.value),
        newAppsFiltered.map((app) => app.value),
        stage,
      ),
    );
  };
  const handleUserFilterSelect = (option: ComboboxOption) => {
    const newUsersFiltered = [...usersFiltered, option];
    setUsersFiltered(newUsersFiltered);
    router.push(
      constructTaskPanelURL(
        basePath,
        page,
        newUsersFiltered.map((user) => user.value),
        appsFiltered.map((app) => app.value),
        stage,
      ),
    );
  };

  const handleAppFilterRemove = (option: ComboboxOption) => {
    const newAppsFiltered = appsFiltered.filter(
      (app) => app.value !== option.value,
    );
    setAppsFiltered(newAppsFiltered);
    router.push(
      constructTaskPanelURL(
        basePath,
        1,
        usersFiltered.map((user) => user.value),
        newAppsFiltered.map((app) => app.value),
        stage,
      ),
    );
  };
  const handleUserFilterRemove = (option: ComboboxOption) => {
    const newUsersFiltered = usersFiltered.filter(
      (user) => user.value !== option.value,
    );
    setUsersFiltered(newUsersFiltered);
    router.push(
      constructTaskPanelURL(
        basePath,
        1,
        newUsersFiltered.map((user) => user.value),
        appsFiltered.map((app) => app.value),
        stage,
      ),
    );
  };
  const handleClearFilters = () => {
    setAppsFiltered([]);
    setUsersFiltered([]);
    router.push(constructTaskPanelURL(basePath, 1, [], [], stage));
  };

  // Switching queues keeps the filters and goes back to page 1.
  const handleStageChange = (value: string) => {
    if (!isTaskStage(value)) {
      return;
    }
    router.push(
      constructTaskPanelURL(
        basePath,
        1,
        usersFiltered.map((user) => user.value),
        appsFiltered.map((app) => app.value),
        value,
      ),
    );
  };

  // handle logic for users and apps shown in table
  const handleTableUserClick = (capture: TaskRow) => {
    if (
      capture.user?.id &&
      capture.user?.name &&
      usersFiltered.every(
        (user: ComboboxOption) => user.value !== capture?.user?.id,
      )
    ) {
      handleUserFilterSelect({
        value: capture.user.id,
        label: capture.user.name,
      });
    }
  };

  const handleTableAppClick = (capture: TaskRow) => {
    if (
      capture.app?.id &&
      capture.app?.metadata.name &&
      appsFiltered.every(
        (app: ComboboxOption) => app.value !== capture?.app?.id,
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
          showUserFilter={isAdmin}
        />
      </div>
      {isAdmin && (
        <Tabs value={stage} onValueChange={handleStageChange}>
          <TabsList aria-label="Review queue">
            {STAGE_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} disabled={loading}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      <p className="text-md mt-1 text-start font-bold tracking-tight">
        Pending Task Submissions{" "}
        <span className="text-muted-foreground">({reviewCapturesCount})</span>
      </p>
      <Separator className="my-2" />
      {/* Capture Table */}
      <div className="bg-muted/10 rounded-xl">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : (
          <TasksTable
            captures={captures}
            stage={stage}
            showWorker={isAdmin}
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
