import { getSession, updateUserRole } from "@/lib/actions/index";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Please sign in to access this page.</h1>
      </div>
    );
  }

  if (session.user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Unauthorized Access</h1>
          <p className="text-lg text-gray-600">You do not have permission to view this page.</p>
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

  async function handleRoleChange(userId: string, newRole: string) {
    "use server"; // server action
    await updateUserRole(userId, newRole);
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Role</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="w-[100px]">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="text-right">
                <form action={async (formData: FormData) => {
                  "use server";
                  const newRole = formData.get("role") as string;
                  await updateUserRole(user.id, newRole);
                }}>
                  <Select defaultValue={user.role} name="role">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
