import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { CaptureStatus, Role } from "@prisma/client";
import { AdminTabs } from "./components/admin-tabs";
import { NotAuthorized } from "@/components/authorized";

export default async function AdminPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect(`/sign-in?callbackUrl=/admin`);
  }
  if (session!.user!.role !== Role.ADMIN) {
    return <NotAuthorized />;
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
