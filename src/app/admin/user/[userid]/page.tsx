import { getUser } from "@/lib/actions/index";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { Param } from "@prisma/client/runtime/library";


export default async function AdminUserDetails({ params }: { params: Promise<{ userid: string }> }) {
  const { userid } = await params; // Await the params promise before destructuring

  if (!userid) { // Validate userId directly
    console.error("User ID is undefined");
    notFound();
  }

  const user = await getUser(userid);

  if (!user) { // Check if user is null or undefined
    notFound();
  }

  user.traces =  []; // Ensure traces is an array

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
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">Uploaded Traces</h2>

          {user.traces.length === 0 ? (
            <p className="text-muted-foreground">No traces uploaded yet.</p>
          ) : (
            <ul className="space-y-3">
              {user.traces.map((trace) => (
                <li
                  key={trace.id}
                  className="flex justify-between items-center rounded-md border p-3 bg-muted/5"
                >
                  <span className="font-mono text-xs">{trace.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(trace.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}