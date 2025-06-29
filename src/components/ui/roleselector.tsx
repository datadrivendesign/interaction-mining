'use client';

import { useTransition } from "react";
import { toast } from "sonner";
import { updateUserRole } from "@/lib/actions/index";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Role } from "@prisma/client";

interface UserRoleSelectorProps {
  userId: string;
  currentRole: Role;
}

export function UserRoleSelector({ userId, currentRole }: UserRoleSelectorProps) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (newRole: Role) => {
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
        toast.success("User role updated successfully!");
      } catch (error) {
        toast.error("Failed to update role. Please try again.");
      }
    });
  };

  return (
    <Select
      defaultValue={currentRole}
      disabled={isPending}
      onValueChange={handleRoleChange}
    >
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={Role.USER}>User</SelectItem>
        <SelectItem value={Role.ADMIN}>Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
