'use client';

import { useTransition } from "react";
import { toast } from "sonner"; // Install if not already
import { updateUserRole } from "@/lib/actions/admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserRoleSelectorProps {
  userId: string;
  currentRole: string;
}

export function UserRoleSelector({ userId, currentRole }: UserRoleSelectorProps) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (newRole: string) => {
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
        <SelectItem value="USER">USER</SelectItem>
        <SelectItem value="ADMIN">ADMIN</SelectItem>
      </SelectContent>
    </Select>
  );
}
