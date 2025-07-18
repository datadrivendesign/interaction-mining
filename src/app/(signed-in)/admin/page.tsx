import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { CaptureStatus, Role } from "@prisma/client";
import { AdminTabs } from "./components/admin-tabs";

export default async function AdminPage() {
  const session = await auth();

  if (!session) {
    redirect(`/sign-in?callbackUrl=/admin`);
  }

  if (session!.user!.role !== Role.ADMIN) {
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

  let users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  let captures = await prisma.capture.findMany({
    where: {
      status: CaptureStatus.REVIEWING,
    },
    include: {
      task: true,
      app: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="flex flex-col w-full h-full items-center justify-center">
      <div className="space-y-4 w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-start">
            Admin Dashboard
          </h1>
        </div>
        <AdminTabs users={users} captures={captures} />
      </div>
    </div>
  );
}
