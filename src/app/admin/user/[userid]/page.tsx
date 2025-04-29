import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";

interface PageProps {
  params: { userId: string };
}

export default async function AdminUserDetails({ params }: PageProps) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      // traces: {
      //   select: {
      //     id: true,
      //     createdAt: true,
      //   },
      // },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* User Info Card */}
      <div className="flex items-center gap-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src={user.image ?? ""} alt="User avatar" />
          <AvatarFallback>
            {user.name?.charAt(0).toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{user.name ?? "Unnamed User"}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
            {user.role}
          </Badge>
        </div>
      </div>

      {/* Traces Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Uploaded Traces</h2>

        {user.traces.length === 0 ? (
          <p className="text-muted-foreground">No traces uploaded yet.</p>
        ) : (
          <div className="rounded-xl bg-muted/10 p-4">
            <ul className="space-y-2">
              {user.traces.map((trace) => (
                <li key={trace.id} className="flex justify-between border-b pb-2">
                  <span className="font-mono text-xs">{trace.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(trace.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
