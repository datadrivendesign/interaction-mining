"use client";

import { ComboboxOption } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { AdminPagination } from "@/components/ui/admin-pagination";
import { Capture } from "@/lib/actions";
import { CaptureStatus } from "@prisma/client";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  constructUserCapturesURL,
  getFilterOptionsForUserCaptures,
  getUserAppsCount,
  getUserCaptures,
  getUserCapturesCount,
} from "../../../util";
import { AdminNavBar } from "../../../components/admin-nav-bar";
import { FilterCapture } from "./filter-user-captures";
import { CaptureCard } from "./capture-card";

/**
 * CapturesList displays a list of capture cards
 * @param captures - The captures to display
 * @returns CapturesList component
 */
function CapturesList({ captures }: { captures: Capture[] }) {
  return (
    <div className="space-y-2">
      {captures.map((capture) => (
        <CaptureCard key={capture.id} capture={capture} />
      ))}
    </div>
  );
}

/**
 * EmptyCaptures displays a message when there are no captures
 * @returns EmptyCaptures component
 */
function EmptyCaptures() {
  return (
    <div className="flex items-center justify-center py-8 text-muted-foreground">
      <AlertCircle className="mr-2 size-4" />
      No captures found.
    </div>
  );
}

/**
 * CapturesColumn displays a column of capture cards
 * @param userId - The ID of the user to display captures for
 * @returns CapturesColumn component
 */
export function CapturesColumn({ userId }: { userId: string }) {
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
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [capturesCount, setCapturesCount] = useState(0);
  const [appsCount, setAppsCount] = useState(0);
  // keep track of available apps for filtering
  const [appsList, setAppsList] = useState<ComboboxOption[]>([]);

  // handle fetching filter options from server
  useEffect(() => {
    const status = (searchParams.get("status") ?? undefined) as
      | CaptureStatus
      | undefined;
    const fetchFilterOptions = async () => {
      const filterOptionsRes = await getFilterOptionsForUserCaptures({
        userId: userId,
        status: status,
      });
      if (filterOptionsRes.ok) {
        const appsData = filterOptionsRes.data ?? [];
        const appsOptions = appsData.map((app) => ({
          value: app.id,
          label: app.metadata.name,
        }));
        setAppsList(appsOptions);
      } else {
        console.error(
          "Failed to fetch filter options:",
          filterOptionsRes.message
        );
      }
    };
    fetchFilterOptions();
  }, [userId, searchParams]);

  // handle fetching captures from server based on filters
  useEffect(() => {
    const appIds = searchParams.get("apps")
      ? searchParams.get("apps")?.split(",")
      : [];
    const status = (searchParams.get("status") ?? undefined) as
      | CaptureStatus
      | undefined;

    const fetchCaptures = async () => {
      setLoading(true);
      const [capturesRes, capturesCountRes, appsCountRes] = await Promise.all([
        getUserCaptures({
          limit: itemsPerPage,
          page: page,
          userId: userId,
          appIds: appIds,
          status: status,
        }),
        getUserCapturesCount({
          userId: userId,
          appIds: appIds,
          status: status,
        }),
        getUserAppsCount({
          userId: userId,
          appIds: appIds,
          status: status,
        }),
      ]);

      if (capturesRes.ok) {
        setCaptures(capturesRes.data ?? []);
      }
      if (capturesCountRes.ok) {
        setCapturesCount(capturesCountRes.data ?? 0);
      }
      if (appsCountRes.ok) {
        setAppsCount(appsCountRes.data ?? 0);
      }
      if (!capturesRes.ok) {
        console.error("Failed to fetch captures:", capturesRes.message);
      }
      if (!capturesCountRes.ok) {
        console.error(
          "Failed to fetch captures count:",
          capturesCountRes.message
        );
      }
      if (!appsCountRes.ok) {
        console.error("Failed to fetch apps count:", appsCountRes.message);
      }
      setLoading(false);
    };
    fetchCaptures();
  }, [page, itemsPerPage, searchParams, userId]);

  // calculate total pages for pagination
  const totalPages = Math.ceil(capturesCount / itemsPerPage);
  // handle page change
  const handlePageChange = (page: number) => {
    const appIds = searchParams.get("apps")
      ? searchParams.get("apps")?.split(",")
      : [];
    const status = (searchParams.get("status") ?? undefined) as
      | CaptureStatus
      | undefined;

    router.push(
      constructUserCapturesURL(userId, page, appIds || [], status || "")
    );
  };

  return (
    <div className="py-3 md:col-span-3">
      <div className="flex flex-col w-full h-full items-center justify-center">
        <div className="space-y-4 w-full max-w-5xl">
          <div className="mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-start">
              Monitor User Activity
            </h1>

            {/* Action buttons for navigation */}
            <AdminNavBar
              currentRoute={`/admin/users/${userId}`}
              showTasksLink={true}
              showUsersLink={true}
            />
          </div>

          <div className="justify-between">
            {/* Filter UI and logic */}
            <FilterCapture userId={userId} page={page} appsList={appsList} />
            <div className="flex flex-row items-center gap-5">
              <p className="text-start mt-1 text-md font-bold tracking-tight">
                Captures Fetched{" "}
                <span className="text-muted-foreground">({capturesCount})</span>
              </p>
              <p className="text-start mt-1 text-md font-bold tracking-tight">
                Apps Fetched{" "}
                <span className="text-muted-foreground">({appsCount})</span>
              </p>
            </div>
            <Separator className="my-2" />
            {/* User Captures List */}
            <div className="rounded-xl bg-muted/10">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
              ) : captures.length === 0 ? (
                <EmptyCaptures />
              ) : (
                <CapturesList captures={captures} />
              )}
            </div>
            {/* Pagination */}
            <AdminPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
