"use client";

import * as React from "react";
import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Role } from "@prisma/client";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { FilterBadge } from "@/components/ui/filter-badge";
import { StatusButtonGroup } from "@/components/ui/status-button-group";

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
      !usersFiltered.some((chosenUser) => chosenUser.value === user.value)
  );
  return (
    <div className="bg-muted/30 rounded-lg p-2 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <label className="text-base font-bold text-foreground whitespace-nowrap">
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
            <Trash className="w-4 h-4" />
            Clear Filters
          </Button>
        </div>
      </div>

      {usersFiltered.length > 0 && (
        <div className="space-y-2">
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
