import { Role, User } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function InfoColumn({ user }: { user: User }) {
  return (
    <div className="py-32 space-y-6 md:col-span-1">
      <Avatar className="w-32 h-32">
        <AvatarImage
          src={user.image ?? ""}
          alt="User avatar"
          crossOrigin="anonymous"
        />
        <AvatarFallback>
          {user.name?.charAt(0).toUpperCase() ?? "U"}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{user.name ?? "Unnamed User"}</h1>
        <p className="text-lg text-muted-foreground">{user.email}</p>
        <Badge variant={user.role === Role.ADMIN ? "default" : "secondary"}>
          {user.role}
        </Badge>
      </div>
    </div>
  );
}
