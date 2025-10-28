"use client";

import { Button } from "@/components/ui/button";
import { CaptureStatus } from "@prisma/client";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { FilterBadge } from "@/components/ui/filter-badge";
import { StatusButtonGroup } from "@/components/ui/status-button-group";
import { Trash } from "lucide-react";

interface FilterCaptureParams {
  appsList: ComboboxOption[];
  appsFiltered: ComboboxOption[];
  statusFiltered: CaptureStatus | "";
  handleAppFilterSelect: (option: ComboboxOption) => void;
  handleAppFilterRemove: (option: ComboboxOption) => void;
  handleStatusFilterSelect: (option: ComboboxOption) => void;
  handleClearFilters: () => void;
}
export function FilterCapture({
  appsList,
  appsFiltered,
  statusFiltered,
  handleAppFilterSelect,
  handleAppFilterRemove,
  handleStatusFilterSelect,
  handleClearFilters,
}: FilterCaptureParams) {
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
