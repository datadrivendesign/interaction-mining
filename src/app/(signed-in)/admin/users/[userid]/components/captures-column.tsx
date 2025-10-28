"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ComboboxOption } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { AdminPagination } from "@/components/ui/admin-pagination";
import { Capture } from "@/lib/actions";
import { Platform, prettyOS } from "@/lib/utils";
import { CaptureStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  constructUserCapturesURL,
  getFilterOptionsForUserCaptures,
  getUserAppsCount,
  getUserCaptures,
  getUserCapturesCount,
} from "../../../util";
import { AdminNavBar } from "../../../components/admin-nav-bar";
import { FilterCapture } from "./filter-user-captures";

function EmptyCaptures() {
  return (
    <div className="flex items-center justify-center py-8 text-muted-foreground">
      <AlertCircle className="mr-2 size-4" />
      No captures found.
    </div>
  );
}

function CaptureCard({ capture }: { capture: Capture }) {
  return (
    <Card className="rounded-md hover:shadow-sm transition p-2">
      <CardHeader className="flex flex-row items-center gap-4">
        <Image
          src={capture.app?.metadata?.icon || "/placeholder.png"}
          alt="App Icon"
          className="w-10 h-10 rounded object-cover"
          width={40}
          height={40}
        />
        <div className="w-full">
          <div className="flex flex-row items-center gap-2">
            <CardTitle className="text-sm font-medium">
              {capture.app?.metadata?.name ?? "Unnamed App"}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {capture.task?.os
                ? prettyOS(capture.task?.os as Platform)
                : "Unknown OS"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {capture.task?.description ?? "No description"}
          </p>
        </div>
        <div>
          <Badge variant="default">{capture.status}</Badge>
        </div>
        <div>
          <Button variant="link" asChild>
            <Link
              href={
                capture.status !== CaptureStatus.REVIEWING
                  ? `/capture/${capture.id}/start`
                  : `/capture/${capture.id}/evaluate`
              }
            >
              Go
            </Link>
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}

function CapturesList({ captures }: { captures: Capture[] }) {
  return (
    <div className="space-y-2">
      {captures.map((capture) => (
        <CaptureCard key={capture.id} capture={capture} />
      ))}
    </div>
  );
}

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
  // keep track of filtered apps
  const [appsList, setAppsList] = useState<ComboboxOption[]>([]);
  const [appsFiltered, setAppsFiltered] = useState<ComboboxOption[]>([]);
  // keep track of filtered status
  const [statusFiltered, setStatusFiltered] = useState<CaptureStatus | "">("");

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

  // pagination logic
  const totalPages = Math.ceil(capturesCount / itemsPerPage);
  const handlePageChange = (page: number) => {
    router.push(
      constructUserCapturesURL(
        userId,
        page,
        appsFiltered.map((app) => app.value),
        statusFiltered
      )
    );
  };

  // handle filter logic
  const handleAppFilterSelect = (option: ComboboxOption) => {
    const newAppsFiltered = [...appsFiltered, option];
    setAppsFiltered(newAppsFiltered);
    router.push(
      constructUserCapturesURL(
        userId,
        page,
        newAppsFiltered.map((app) => app.value),
        statusFiltered
      )
    );
  };

  const handleAppFilterRemove = (option: ComboboxOption) => {
    const newAppsFiltered = appsFiltered.filter(
      (app) => app.value !== option.value
    );
    setAppsFiltered(newAppsFiltered);
    router.push(
      constructUserCapturesURL(
        userId,
        page,
        newAppsFiltered.map((app) => app.value),
        statusFiltered
      )
    );
  };

  // handle role filter logic
  const handleStatusFilterSelect = (option: ComboboxOption) => {
    const newSelectedStatus = option.value as CaptureStatus | "";
    setStatusFiltered(newSelectedStatus);
    router.push(
      constructUserCapturesURL(
        userId,
        page,
        appsFiltered.map((app) => app.value),
        newSelectedStatus
      )
    );
  };

  // handle clear filters logic
  const handleClearFilters = () => {
    setAppsFiltered([]);
    setStatusFiltered("");
    router.push(constructUserCapturesURL(userId, page, [], ""));
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
            <FilterCapture
              appsList={appsList}
              appsFiltered={appsFiltered}
              statusFiltered={statusFiltered}
              handleAppFilterSelect={handleAppFilterSelect}
              handleAppFilterRemove={handleAppFilterRemove}
              handleStatusFilterSelect={handleStatusFilterSelect}
              handleClearFilters={handleClearFilters}
            />
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
