'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { redirect, useRouter, usePathname } from "next/navigation";
import { getUserCaptures } from "@/lib/actions/index";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Prisma } from "@prisma/client";
import Image from "next/image";

type CaptureIncludeRelations = Prisma.CaptureGetPayload<{
  include: { app: true, task: true }
}>

export default function ProfilePage() {
  const { data: session, status} = useSession();
  const router = useRouter();

  const [captures, setCaptures] = useState<CaptureIncludeRelations[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, router]);

 useEffect(() => {
    async function fetchCaptures() {
      if (session?.user?.id) {
        const captureData = await getUserCaptures(session.user.id);
        setCaptures(captureData);
      }
    }
    if (status === "authenticated") fetchCaptures();
  }, [session, status]);

  if (status === "loading") {
    return <div className="p-6 text-center text-muted-foreground">Loading session...</div>;
  }

  if (status==="unauthenticated") return null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={session?.user?.image ?? ""} alt="User avatar" />
          <AvatarFallback>
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold">Welcome, {session?.user?.name}</h1>
          <p className="text-muted-foreground text-sm">{session?.user?.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        {captures.map((cap) => (
          <Card key={cap.id} className="border bg-muted/50 hover:shadow-md transition rounded-xl">
            <a href={`/capture/${cap.id}/edit`} className="block w-full h-full">
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Image
                src={cap.app?.metadata?.icon || "/placeholder.png"}
                alt="App Icon"
                className="w-10 h-10 rounded object-cover"
                width={40}
                height={40}
              />
              <div className="flex flex-col w-full">
                <CardTitle className="text-base font-medium">
                  {cap.app?.metadata?.name ?? "Unnamed App"}
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {cap.task?.description ?? "No description provided"}
                </p>
                <div className="text-sm text-muted-foreground line-clamp-1">
                  <span>{cap.task?.os ?? "Unknown OS"}</span>
                  {/* <span>Capture ID: {cap.id.slice(0, 6)}...</span> */}
                </div>
              </div>
            </CardHeader>
            </a>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => router.push("/capture/new")}>
          + New Capture
        </Button>
      </div>


    </div>
  );
}
