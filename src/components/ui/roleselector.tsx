"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateUserRole } from "@/lib/actions/index";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";

interface UserRoleSelectorProps {
  userId: string;
  currentRole: Role;
}

export function UserRoleSelector({
  userId,
  currentRole,
}: UserRoleSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const { data: session } = useSession();

  // do not render if user is not admin
  if (session?.user?.role !== Role.ADMIN) {
    return <></>;
  }

  const handleRoleChange = (newRole: Role) => {
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      if (res.ok) {
        toast.success("User role updated successfully!");
      } else {
        toast.error(res.message);
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
