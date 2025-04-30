import { getUser, getUserCaptures } from "@/lib/actions/index";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";

export default async function AdminUserDetails({ params }: { params: Promise<{ userid: string }> }) {
  const { userid } = await params;

  if (!userid) {
    console.error("User ID is undefined");
    notFound();
  }

  const [user, captures] = await Promise.all([
    getUser(userid),
    getUserCaptures(userid)
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="p-32 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        {/* Left column: User Info */}
        <div className="space-y-6">
          <Avatar className="w-32 h-32">
            <AvatarImage src={user.image ?? ""} alt="User avatar" />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{user.name ?? "Unnamed User"}</h1>
            <p className="text-lg text-muted-foreground">{user.email}</p>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
              {user.role}
            </Badge>
          </div>
        </div>

        {/* Right column: Traces */}
        {captures.length === 0 ? (
          <p className="text-muted-foreground">No captures uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {captures.map((cap) => (
              <Card key={cap.id} className="rounded-md hover:shadow-sm transition">
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <img
                    src={cap.app?.metadata?.icon || "/placeholder.png"}
                    alt="App Icon"
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="w-full">
                    <CardTitle className="text-sm font-medium">
                      {cap.app?.metadata?.name ?? "Unnamed App"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {cap.task?.description ?? "No description"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Platform: {cap.task?.os ?? "Unknown OS"} | ID: {cap.id.slice(0, 6)}...
                    </p>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}