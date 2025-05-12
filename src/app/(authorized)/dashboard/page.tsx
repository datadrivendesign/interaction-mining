"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Beaker, Cake, CircleDot, Loader2, Plus } from "lucide-react";
import { Prisma, User } from "@prisma/client";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { getCaptures } from "@/lib/actions";
import { googleImageAdapter } from "../lib/image";
import { prettyTime } from "@/lib/utils";
import { handleTest } from "./util";

const os = {
  ios: "iOS",
  android: "Android",
  web: "Web",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user as User;

  const [captures, setCaptures] = useState<
    Prisma.CaptureGetPayload<{
      include: { app: true; task: true };
    }>[]
  >([]);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.id) return;

      // Fetch user captures
      const captureRes = await getCaptures({
        userId: user.id,
        includes: {
          app: true,
          task: true,
        },
      });

      if (!captureRes.ok) {
        toast.error("Failed to fetch captures. Please try again later.");
        console.error("Failed to fetch captures:", captureRes.message);
        return;
      }

      setCaptures(captureRes.data);
    }

    if (status === "unauthenticated") {
      redirect("/sign-in");
    }

    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  return (
    <>
      <main className="flex flex-col grow justify-start items-center min-w-dvw min-h-dvh">
        {status === "authenticated" && session ? (
          <div className="flex w-full max-w-screen-lg p-6 gap-6">
            <Card className="flex flex-col w-1/3 p-6">
              <aside>
                <Avatar className="w-full h-auto aspect-square mb-4">
                  <AvatarImage
                    src={googleImageAdapter(user?.image ?? "", 512)}
                    alt="User avatar"
                  />
                  <AvatarFallback>
                    {user?.name?.[0]?.toUpperCase() ?? ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <h1 className="text-xl font-semibold">{user?.name}</h1>
                  <span className="text-muted-foreground">{user?.email}</span>
                  <p className="inline-flex items-center text-muted-foreground">
                    <CircleDot className="mr-1 size-4" />
                    <span className="text-foreground font-semibold tabular-nums mr-1">
                      {user.captures.length}
                    </span>
                    {user.captures.length === 1 ? "capture" : "captures"}
                    <span className="mx-1">•</span>
                    <span className="text-foreground font-semibold tabular-nums mr-1">
                      {user.traces.length}
                    </span>
                    {user.traces.length === 1 ? "trace" : "traces"}
                  </p>
                  <span className="inline-flex items-center text-muted-foreground">
                    <Cake className="mr-1 size-4" />
                    Contributer since{" "}
                    {prettyTime(new Date(user?.createdAt), {
                      format: "yyyy",
                    })}
                  </span>
                </div>
              </aside>
            </Card>
            <div className="flex flex-col w-2/3">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold tracking-tight">Captures</h1>
                <div className="flex justify-end gap-2">
                  <Button
                    size={"sm"}
                    variant={"secondary"}
                    onClick={handleTest}
                  >
                    <Beaker /> Test
                  </Button>
                  <Link href="/capture/new">
                    <Button size={"sm"}>
                      <Plus /> New
                    </Button>
                  </Link>
                </div>
              </div>

              {captures.length > 0 ? (
                <div className="flex flex-col space-y-4">
                  {captures.map((capture) => (
                    <Card key={capture.id}>
                      <CardHeader className="flex flex-row justify-between gap-4 space-y-0">
                        <div className="flex gap-4">
                          {capture.app?.metadata?.icon ? (
                            <Image
                              src={capture.app?.metadata?.icon}
                              alt="App Icon"
                              className="w-16 h-16 rounded-2xl object-cover"
                              width={64}
                              height={64}
                            />
                          ) : (
                            <div className="size-16 rounded-2xl bg-muted-background animate-pulse" />
                          )}

                          <div className="flex flex-col w-full">
                            <h1 className="text-foreground font-semibold">
                              {capture.app?.metadata?.name ?? "Unnamed App"} (
                              {capture.task?.os
                                ? os[capture.task?.os]
                                : "Unknown OS"}
                              )
                            </h1>
                            <p className="text-sm text-muted-foreground">
                              {capture.task?.description ??
                                "No description provided"}
                            </p>
                          </div>
                        </div>
                        <Button size={"sm"} variant={"secondary"}>
                          <Link href={`/capture/${capture.id}/start`}>
                            <span className="text-sm">Edit</span>
                          </Link>
                        </Button>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6">
                  <div className="flex flex-col items-center justify-center w-full">
                    <span className="text-lg text-muted-foreground font-medium">
                      No captures yet.
                    </span>
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col grow justify-center items-center w-full h-full">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Loading your profile...
            </h1>
          </div>
        )}
      </main>
    </>
  );
}
