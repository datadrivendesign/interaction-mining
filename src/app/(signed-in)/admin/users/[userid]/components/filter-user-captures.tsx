"use client";

import { Button } from "@/components/ui/button";
import { CaptureStatus } from "@prisma/client";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { FilterBadge } from "@/components/ui/filter-badge";
import { StatusButtonGroup } from "@/components/ui/status-button-group";
import { Trash } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { constructUserCapturesURL } from "../../../util";

interface FilterCaptureParams {
  userId: string;
  page: number;
  appsList: ComboboxOption[];
  onFiltersChange?: (
    apps: ComboboxOption[],
    status: CaptureStatus | ""
  ) => void;
}
/**
 * FilterCapture manages filter state and UI for user captures
 * @param userId - The user ID to filter captures for
 * @param page - Current page number
 * @param appsList - Available apps for filtering
 * @param onFiltersChange - Optional callback when filters change
 */
export function FilterCapture({
  userId,
  page,
  appsList,
  onFiltersChange,
}: FilterCaptureParams) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter state
  const [appsFiltered, setAppsFiltered] = useState<ComboboxOption[]>([]);
  const [statusFiltered, setStatusFiltered] = useState<CaptureStatus | "">("");

  // Sync filter state with URL params
  useEffect(() => {
    // Reconstruct appsFiltered from appIds and appsList
    const appIds = searchParams.get("apps")?.split(",") ?? [];
    const filtered = appsList.filter(
      (app) => appIds?.includes(app.value) ?? false
    );
    setAppsFiltered(filtered);
    // construct status from url params
    const status = (searchParams.get("status") ?? "") as CaptureStatus | "";
    setStatusFiltered(status);
  }, [searchParams, appsList]);

  // Helper function to construct URL with current filters
  const constructURL = (
    newPage: number,
    newApps: ComboboxOption[],
    newStatus: CaptureStatus | ""
  ) => {
    return constructUserCapturesURL(
      userId,
      newPage,
      newApps.map((app) => app.value),
      newStatus
    );
  };

  // Filter handlers
  const handleAppFilterSelect = (option: ComboboxOption) => {
    const newAppsFiltered = [...appsFiltered, option];
    setAppsFiltered(newAppsFiltered);
    onFiltersChange?.(newAppsFiltered, statusFiltered);
    router.push(constructURL(page, newAppsFiltered, statusFiltered));
  };

  const handleAppFilterRemove = (option: ComboboxOption) => {
    const newAppsFiltered = appsFiltered.filter(
      (app) => app.value !== option.value
    );
    setAppsFiltered(newAppsFiltered);
    onFiltersChange?.(newAppsFiltered, statusFiltered);
    router.push(constructURL(page, newAppsFiltered, statusFiltered));
  };

  const handleStatusFilterSelect = (option: ComboboxOption) => {
    const newSelectedStatus = option.value as CaptureStatus | "";
    setStatusFiltered(newSelectedStatus);
    onFiltersChange?.(appsFiltered, newSelectedStatus);
    router.push(constructURL(page, appsFiltered, newSelectedStatus));
  };

  const handleClearFilters = () => {
    setAppsFiltered([]);
    setStatusFiltered("");
    onFiltersChange?.([], "");
    router.push(constructUserCapturesURL(userId, page, [], ""));
  };
  const CaptureStatusOptions = [
    { value: "", label: "All" },
    { value: CaptureStatus.CREATED, label: "Created" },
    { value: CaptureStatus.PROCESSING, label: "Processing" },
    { value: CaptureStatus.REVIEWING, label: "Reviewing" },
    { value: CaptureStatus.APPROVED, label: "Approved" },
  ];

  const nonFilteredApps = appsList.filter(
    (app) => !appsFiltered.some((chosenApp) => chosenApp.value === app.value)
  );

  return (
    <div className="bg-muted/30 rounded-lg p-2">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <label className="text-base font-bold text-foreground whitespace-nowrap">
            Filter Apps:
          </label>
          <Combobox
            options={nonFilteredApps}
            selectCallback={handleAppFilterSelect}
          />
        </div>
        {/* Status filter - use status button group */}
        <StatusButtonGroup
          options={CaptureStatusOptions}
          selected={statusFiltered}
          onChange={handleStatusFilterSelect}
          label="Filter Status:"
        />
        {/* Clear Filters Button */}
        <div className="flex items-center justify-end self-end">
          <Button variant="destructive" size="sm" onClick={handleClearFilters}>
            <Trash className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>

      {appsFiltered.length > 0 && (
        <div className="space-y-2">
          <div>
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium text-foreground mr-2">
                Selected Apps:
              </span>
              <span className="text-sm text-muted-foreground">
                {appsFiltered.length} apps selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {appsFiltered.map((app) => (
                <FilterBadge
                  key={app.value}
                  label={app.label}
                  onRemove={() => handleAppFilterRemove(app)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
