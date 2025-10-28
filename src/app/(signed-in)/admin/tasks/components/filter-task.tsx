"use client";

import * as React from "react";
import { Trash, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Combobox, ComboboxOption } from "../../util/combobox";

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
    (app) => !appsFiltered.some((chosenApp) => chosenApp.value === app.value)
  );
  const nonFilteredUsers = usersList.filter(
    (user) =>
      !usersFiltered.some((chosenUser) => chosenUser.value === user.value)
  );
  return (
    <div className="bg-muted/30 rounded-lg p-2 space-y-4">
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

        <div className="flex items-center gap-2">
          <label className="text-base font-bold text-foreground whitespace-nowrap">
            Filter Users:
          </label>
          <Combobox
            options={nonFilteredUsers}
            selectCallback={handleUserFilterSelect}
          />
        </div>

        <div className="flex items-center justify-end self-end">
          <Button variant="destructive" size="sm" onClick={handleClearFilters}>
            <Trash className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>

      {(appsFiltered.length > 0 || usersFiltered.length > 0) && (
        <div className="space-y-2">
          {appsFiltered.length > 0 && (
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
                    className="flex items-center gap-2 pr-2 hover:bg-red-500/100 dark:hover:bg-red-500/100 hover:text-white cursor-pointer"
                    onClick={() => handleAppFilterRemove(app)}
                  >
                    <X className="h-2 w-2" />
                    {app.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {usersFiltered.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-foreground mr-2">
                  Selected Users:
                </span>
                <span className="text-sm text-muted-foreground">
                  {usersFiltered.length} users selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {usersFiltered.map((user) => (
                  <Badge
                    key={user.value}
                    variant="secondary"
                    className="flex items-center gap-2 pr-2 hover:bg-red-500/100 dark:hover:bg-red-500/100 hover:text-white cursor-pointer"
                    onClick={() => handleUserFilterRemove(user)}
                  >
                    <X className="h-2 w-2" />
                    {user.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
