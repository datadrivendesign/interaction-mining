"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) return null; // or a loading skeleton

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src={session.user?.image ?? ""} alt="User avatar" />
          <AvatarFallback>
            {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>

        <div>
          <h1 className="text-2xl font-bold">Welcome back, {session.user?.name ?? "User"}</h1>
          <p className="text-muted-foreground text-sm">{session.user?.email}</p>
        </div>
      </div>

      <div>
        <Button onClick={() => router.push("/capture/new")}>
          Start Capture
        </Button>
      </div>
    </div>
  );
}
