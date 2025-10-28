"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
import { CaptureStatus } from "@prisma/client";
import { Combobox, ComboboxOption } from "../../../util/combobox";
import { Trash, X } from "lucide-react";

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

        {/* Status filter - use radio buttons */}
        <div className="flex items-center gap-2">
          <label className="text-base font-bold text-foreground whitespace-nowrap">
            Status:
          </label>
          <div className="flex rounded-md border border-input bg-background">
            <ButtonGroup>
              {CaptureStatusOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    statusFiltered === option.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleStatusFilterSelect(option)}
                  className={cn(
                    statusFiltered === option.value
                      ? "bg-blue-500/100 text-white"
                      : "",
                    "text-xs hover:bg-blue-500/100 hover:text-white pointer-cursor"
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        </div>

        <div className="flex items-center justify-end self-end">
          <Button variant="destructive" size="sm" onClick={handleClearFilters}>
            {/* handleClearFilters */}
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
                <Badge
                  key={app.value}
                  variant="secondary"
                  className="flex items-center gap-2 pr-2 cursor-pointer hover:bg-red-500/100 dark:hover:bg-red-500/100 hover:text-white"
                  onClick={() => handleAppFilterRemove(app)}
                >
                  <X className="h-2 w-2 cursor-pointer" />
                  {app.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
