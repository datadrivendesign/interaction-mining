import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface PageProps {
  params: { userId: string };
}

export default async function UserTracesPage({ params }: PageProps) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Details</h1>
      <div className="rounded-xl bg-muted/10 p-4 space-y-4">
        <div>
          <span className="font-bold">Name:</span> {user.name ?? "N/A"}
        </div>
        <div>
          <span className="font-bold">Email:</span> {user.email}
        </div>
        <div>
          <span className="font-bold">Role:</span> {user.role}
        </div>
      </div>
    </div>
  );
}
