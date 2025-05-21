import { getCaptures, getUser } from "@/lib/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function AdminUserDetails({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const { userid } = await params;

  if (!userid) {
    console.error("User ID is undefined");
    notFound();
  }

  const [userRes, capturesRes] = await Promise.all([
    getUser(userid),
    getCaptures({
      userId: userid,
      includes: {
        app: true,
        task: true,
      },
    }) ?? [],
  ]);

  if (!userRes.ok) {
    notFound();
  }

  const user = userRes.data;
  const captures = capturesRes.ok ? capturesRes.data : [];

  return (
    <div className="p-32 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
        {/* Left column: User Info */}
        <div className="space-y-6 md:col-span-1">
          <Avatar className="w-32 h-32">
            <AvatarImage src={user.image ?? ""} alt="User avatar" />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">
              {user.name ?? "Unnamed User"}
            </h1>
            <p className="text-lg text-muted-foreground">{user.email}</p>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
              {user.role}
            </Badge>
          </div>
        </div>

        {/* Right column: Traces */}
        <div className="md:col-span-3">
          <h2 className="text-2xl font-semibold mb-6">User Captures</h2>
          {captures.length === 0 ? (
            <p className="text-muted-foreground">No captures uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {captures.map((cap) => (
                <Card
                  key={cap.id}
                  className="rounded-md hover:shadow-sm transition"
                >
                  <CardHeader className="flex flex-row items-center gap-4 p-4">
                    <Image
                      src={cap.app?.metadata?.icon || "/placeholder.png"}
                      alt="App Icon"
                      className="w-10 h-10 rounded object-cover"
                      width={40}
                      height={40}
                    />
                    <div className="w-full">
                      <CardTitle className="text-sm font-medium">
                        {cap.app?.metadata?.name ?? "Unnamed App"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {cap.task?.description ?? "No description"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Platform: {cap.task?.os ?? "Unknown OS"}
                      </p>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
