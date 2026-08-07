"use client";

import { ComboboxOption } from "@/components/ui/combobox";
import { AdminPagination } from "@/components/ui/admin-pagination";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  constructUserPanelURL,
  getFilterOptionsForUsers,
  getUsersCount,
  getUsersForAdmin,
  ManageableUser,
} from "../../util";
import { FilterUser } from "./filter-user";
import { Role } from "@prisma/client";
import { UsersTable } from "./users-table";

/**
 * UsersPanel is the main panel for the users page
 * @returns UsersPanel component
 */
export function UsersPanel() {
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
  const [users, setUsers] = useState<ManageableUser[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  // keep track of filtered users
  const [usersList, setUsersList] = useState<ComboboxOption[]>([]);
  const [usersFiltered, setUsersFiltered] = useState<ComboboxOption[]>([]);
  // keep track of filtered roles
  const [roleFiltered, setRoleFiltered] = useState<Role | "">("");

  // handle fetching filter options from server
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const filterOptionsRes = await getFilterOptionsForUsers();
      if (filterOptionsRes.ok) {
        const usersData = filterOptionsRes.data ?? [];
        const usersOptions = usersData.map((user) => ({
          value: user.id,
          label: user.name ?? user.email ?? "Unknown",
        }));
        setUsersList(usersOptions);
      } else {
        console.error(
          "Failed to fetch filter options:",
          filterOptionsRes.message,
        );
      }
    };
    fetchFilterOptions();
  }, [searchParams]);

  // handle updating filtered objects from url parameters
  useEffect(() => {
    const usersIds = searchParams.get("users")
      ? searchParams.get("users")?.split(",")
      : [];
    setUsersFiltered(
      usersList.filter((user) => usersIds?.includes(user.value)),
    );
    const role = (searchParams.get("role") ?? "") as Role | "";
    setRoleFiltered(role);
  }, [usersList, searchParams]);

  // handle fetching users from server based on filters
  useEffect(() => {
    const userIds = searchParams.get("users")
      ? searchParams.get("users")?.split(",")
      : [];
    const role = (searchParams.get("role") ?? undefined) as Role | undefined;

    const fetchUsers = async () => {
      setLoading(true);
      const [usersRes, usersCountRes] = await Promise.all([
        getUsersForAdmin({
          limit: itemsPerPage,
          page: page,
          userIds: userIds,
          role: role,
        }),
        getUsersCount({
          userIds,
          role: role,
        }),
      ]);

      if (usersRes.ok) {
        setUsers(usersRes.data ?? []);
      }
      if (usersCountRes.ok) {
        setUsersCount(usersCountRes.data ?? 0);
      }

      if (!usersRes.ok) {
        console.error("Failed to fetch users:", usersRes.message);
      }
      if (!usersCountRes.ok) {
        console.error("Failed to fetch users count:", usersCountRes.message);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [page, itemsPerPage, searchParams]);

  const validUsers = users.filter(
    (user) => user.name !== null && user.email !== null,
  );

  // pagination logic
  const totalPages = Math.ceil(usersCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    router.push(
      constructUserPanelURL(
        page,
        usersFiltered.map((user) => user.value),
        roleFiltered,
      ),
    );
  };

  // handle filter logic
  const handleUserFilterSelect = (option: ComboboxOption) => {
    const newUsersFiltered = [...usersFiltered, option];
    setUsersFiltered(newUsersFiltered);
    router.push(
      constructUserPanelURL(
        page,
        newUsersFiltered.map((user) => user.value),
        roleFiltered,
      ),
    );
  };

  const handleUserFilterRemove = (option: ComboboxOption) => {
    const newUsersFiltered = usersFiltered.filter(
      (user) => user.value !== option.value,
    );
    setUsersFiltered(newUsersFiltered);
    router.push(
      constructUserPanelURL(
        page,
        newUsersFiltered.map((user) => user.value),
        roleFiltered,
      ),
    );
  };

  // handle role filter logic
  const handleRoleFilterSelect = (option: ComboboxOption) => {
    const newSelectedRole = option.value as Role | "";
    setRoleFiltered(newSelectedRole);
    router.push(
      constructUserPanelURL(
        page,
        usersFiltered.map((user) => user.value),
        newSelectedRole,
      ),
    );
  };

  // handle clear filters logic
  const handleClearFilters = () => {
    setUsersFiltered([]);
    setRoleFiltered("");
    router.push(constructUserPanelURL(page, [], ""));
  };

  // handle logic for users shown in table
  const handleTableUserClick = (user: ManageableUser) => {
    if (
      user.id &&
      user.name &&
      usersFiltered.every(
        (filteredUser: ComboboxOption) => filteredUser.value !== user.id,
      )
    ) {
      handleUserFilterSelect({
        value: user.id,
        label: user.name,
      });
    }
  };

  return (
    <>
      <div className="justify-between">
        <p className="mt-1 text-start text-lg font-bold tracking-tight">
          Users Fetched{" "}
          <span className="text-muted-foreground">({usersCount})</span>
        </p>
        <FilterUser
          usersList={usersList}
          usersFiltered={usersFiltered}
          roleFiltered={roleFiltered}
          handleUserFilterSelect={handleUserFilterSelect}
          handleUserFilterRemove={handleUserFilterRemove}
          handleRoleFilterSelect={handleRoleFilterSelect}
          handleClearFilters={handleClearFilters}
        />
      </div>
      {/* Users Table */}
      <div className="bg-muted/10 rounded-xl p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : (
          <UsersTable
            users={validUsers}
            handleTableUserClick={handleTableUserClick}
          />
        )}
      </div>

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
}
