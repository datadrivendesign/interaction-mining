"use client";

import * as React from "react";
import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Role } from "@prisma/client";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { FilterBadge } from "@/components/ui/filter-badge";
import { StatusButtonGroup } from "@/components/ui/status-button-group";
import { useRouter } from "next/router";
import { constructUserPanelURL } from "../../util";
import { useState } from "react";

const RoleOptions = [
  { value: "", label: "All" },
  { value: Role.ADMIN, label: "Admin" },
  { value: Role.USER, label: "User" },
];

interface FilterUserParams {
  usersList: ComboboxOption[];
  usersFiltered: ComboboxOption[];
  roleFiltered: Role | "";
  handleUserFilterSelect: (option: ComboboxOption) => void;
  handleUserFilterRemove: (option: ComboboxOption) => void;
  handleRoleFilterSelect: (option: ComboboxOption) => void;
  handleClearFilters: () => void;
}

/**
 * FilterUser renders the filter UI for users panel. It only manages the UI, the logic needs to be handled by the parent component.
 * @param usersList - Available users for filtering
 * @param usersFiltered - Currently filtered users
 * @param roleFiltered - Currently selected role filter
 * @param handleUserFilterSelect - Handler for selecting a user filter
 * @param handleUserFilterRemove - Handler for removing a user filter
 * @param handleRoleFilterSelect - Handler for selecting a role filter
 * @param handleClearFilters - Handler for clearing all filters
 */
export function FilterUser({
  usersList,
  usersFiltered,
  roleFiltered,
  handleUserFilterSelect,
  handleUserFilterRemove,
  handleRoleFilterSelect,
  handleClearFilters,
}: FilterUserParams) {
  const nonFilteredUsers = usersList.filter(
    (user) =>
      !usersFiltered.some((chosenUser) => chosenUser.value === user.value),
  );
  return (
    <div className="bg-muted/30 space-y-4 rounded-lg p-2">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <label className="text-base font-bold whitespace-nowrap text-foreground">
            Filter Users:
          </label>
          <Combobox
            options={nonFilteredUsers}
            selectCallback={handleUserFilterSelect}
          />
        </div>
        {/* Role filter - use status button group */}
        <StatusButtonGroup
          options={RoleOptions}
          selected={roleFiltered}
          onChange={handleRoleFilterSelect}
          label="Filter Role:"
        />

        <div className="flex items-center justify-end self-end">
          <Button variant="destructive" size="sm" onClick={handleClearFilters}>
            <Trash className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </div>

      {usersFiltered.length > 0 && (
        <div className="space-y-2">
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
        </div>
      )}
    </div>
  );
}
