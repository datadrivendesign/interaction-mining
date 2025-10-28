"use client";

import * as React from "react";
import { Trash, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Role } from "@prisma/client";
import { ButtonGroup } from "@/components/ui/button-group";
import { Combobox, ComboboxOption } from "../../util/combobox";

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

        {/* Role filter - use radio buttons */}
        <div className="flex items-center gap-2">
          <label className="text-base font-bold text-foreground whitespace-nowrap">
            Filter Role:
          </label>
          <div className="flex items-center gap-2">
            <ButtonGroup>
              {RoleOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    roleFiltered === option.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleRoleFilterSelect(option)}
                  className={cn(
                    roleFiltered === option.value
                      ? "bg-blue-500/100 text-white"
                      : "",
                    "text-xs hover:bg-blue-500/100 hover:text-white"
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
                <Badge
                  key={user.value}
                  variant="secondary"
                  className="flex items-center gap-2 pr-2 cursor-pointer hover:bg-red-500/100 dark:hover:bg-red-500/100 hover:text-white"
                  onClick={() => handleUserFilterRemove(user)}
                >
                  <X className="h-2 w-2 cursor-pointer" />
                  {user.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
