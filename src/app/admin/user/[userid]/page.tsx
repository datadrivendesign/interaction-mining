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

  console.log("User details:", userid);
  const user = await getUser(userid);

  if (!user) { // Check if user is null or undefined
    notFound();
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* User Profile Card */}
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

      {/* User Traces Section */}
      {/* <div className="space-y-4">
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
      </div> */}
    </div>
  );
}
