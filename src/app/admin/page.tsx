import { getSessionData, updateUserRole } from "@/lib/actions/index";
import { prisma } from "@/lib/prisma";
import { UserRoleSelector } from "@/components/ui/roleselector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ChevronRight } from "lucide-react"
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getSessionData();

  if (!session) {
    redirect(`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/sign-in?callbackUrl=/admin`);
  }

  if (session!.user!.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">
            Unauthorized Access
          </h1>
          <p className="text-lg text-gray-600">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="space-y-4 w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-center">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-center mt-1">
            Manage platform users and their roles.
          </p>
        </div>

        {/* Filter/Search Bar */}
        <div className="flex items-center gap-4 mb-6">
          <Input
            placeholder="Search users by name or email"
            className="w-full max-w-sm"
          />
          {/* You can add more filters here later */}
        </div>

        {/* Users Table */}
        <div className="rounded-xl bg-muted/10 p-4">
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
                <TableRow key={user.id} className="hover:bg-muted/10 border-0" >
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <UserRoleSelector
                      userId={user.id}
                      currentRole={user.role}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/user/${user.id}`}
                    >
                      <Button variant="outline" size="icon" className="hover">
                      <ChevronRight />  
                      </Button>
                    </Link>
                  </TableCell>
              
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}