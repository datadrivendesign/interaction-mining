"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ManageableUser } from "../../util";
import { Role } from "@prisma/client";

/**
 * UsersTable displays a table of users
 * @param users - Array of users to display
 * @param handleTableUserClick - Callback when user is clicked
 * @returns UsersTable component
 */
export function UsersTable({
  users,
  handleTableUserClick,
}: {
  users: ManageableUser[];
  handleTableUserClick: (user: ManageableUser) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-none">
          <TableHead className="text-muted-foreground">Name</TableHead>
          <TableHead className="text-muted-foreground">Email</TableHead>
          <TableHead className="text-muted-foreground">Role</TableHead>
          <TableHead className="text-muted-foreground"></TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id} className="hover:bg-muted/10 border-0">
            <TableCell className="font-medium">
              <Button
                variant="outline"
                className="hover p-2 cursor-pointer"
                onClick={() => handleTableUserClick(user)}
              >
                {user.name}
              </Button>
            </TableCell>
            <TableCell>
              <Link href={`/admin/users/${user.id}`}>
                <Button
                  variant="link"
                  className="hover:bg-transparent p-2 cursor-pointer"
                >
                  {user.email}
                </Button>
              </Link>
            </TableCell>
            <TableCell>
              <Badge
                variant={user.role === Role.ADMIN ? "secondary" : "default"}
                className={
                  user.role === Role.ADMIN
                    ? "bg-green-500 text-white dark:bg-green-600"
                    : ""
                }
              >
                {user.role}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
