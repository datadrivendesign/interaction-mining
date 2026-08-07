"use client";

import * as React from "react";
import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { FilterBadge } from "@/components/ui/filter-badge";

interface FilterTaskParams {
  appsList: ComboboxOption[];
  usersList: ComboboxOption[];
  appsFiltered: ComboboxOption[];
  usersFiltered: ComboboxOption[];
  handleAppFilterSelect: (option: ComboboxOption) => void;
  handleUserFilterSelect: (option: ComboboxOption) => void;
  handleAppFilterRemove: (option: ComboboxOption) => void;
  handleUserFilterRemove: (option: ComboboxOption) => void;
  handleClearFilters: () => void;
}

/**
 * FilterTask renders the filter UI for tasks panel. It only manages the UI, the logic needs to be handled by the parent component.
 * @param appsList - Available apps for filtering
 * @param usersList - Available users for filtering
 * @param appsFiltered - Currently filtered apps
 * @param usersFiltered - Currently filtered users
 * @param handleAppFilterSelect - Handler for selecting a app filter
 * @param handleUserFilterSelect - Handler for selecting a user filter
 * @param handleAppFilterRemove - Handler for removing a app filter
 * @param handleUserFilterRemove - Handler for removing a user filter
 * @param handleClearFilters - Handler for clearing all filters
 * @returns
 */
export function FilterTask({
  appsList,
  usersList,
  appsFiltered,
  usersFiltered,
  handleAppFilterSelect,
  handleUserFilterSelect,
  handleAppFilterRemove,
  handleUserFilterRemove,
  handleClearFilters,
}: FilterTaskParams) {
  const nonFilteredApps = appsList.filter(
    (app) => !appsFiltered.some((chosenApp) => chosenApp.value === app.value),
  );
  const nonFilteredUsers = usersList.filter(
    (user) =>
      !usersFiltered.some((chosenUser) => chosenUser.value === user.value),
  );
  return (
    <div className="bg-muted/30 space-y-4 rounded-lg p-2">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <label className="text-base font-bold whitespace-nowrap text-foreground">
            Filter Apps:
          </label>
          <Combobox
            options={nonFilteredApps}
            selectCallback={handleAppFilterSelect}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-base font-bold whitespace-nowrap text-foreground">
            Filter Users:
          </label>
          <Combobox
            options={nonFilteredUsers}
            selectCallback={handleUserFilterSelect}
          />
        </div>

        <div className="flex items-center justify-end self-end">
          <Button variant="destructive" size="sm" onClick={handleClearFilters}>
            <Trash className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {(appsFiltered.length > 0 || usersFiltered.length > 0) && (
        <div className="space-y-2">
          {appsFiltered.length > 0 && (
            <div>
              <div className="mb-2 flex items-center">
                <span className="mr-2 text-sm font-medium text-foreground">
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
          )}

          {usersFiltered.length > 0 && (
            <div>
              <div className="mb-2 flex items-center">
                <span className="mr-2 text-sm font-medium text-foreground">
                  Selected Users:
                </span>
                <span className="text-sm text-muted-foreground">
                  {usersFiltered.length} users selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {usersFiltered.map((user) => (
                  <FilterBadge
                    key={user.value}
                    label={user.label}
                    onRemove={() => handleUserFilterRemove(user)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
