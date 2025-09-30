import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { User, CaptureStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { auth } from "@/lib/auth/auth";
import { getCaptures, getTraces } from "@/lib/actions";
import {
  CaptureCardColumns,
  NoCapturesCard,
} from "./components/capture-card-columns";
import { ProfileCard } from "./components/profile-card";
import { TracesList, NoTracesCard } from "./components/traces-list";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  const user = session.user as User;

  const [capturesData, tracesData] = await Promise.all([
    getCaptures({
      userId: user.id,
      includes: { app: true, task: true },
    }),
    getTraces({
      userId: user.id,
      includes: { app: true, task: true },
    }),
  ]);

  if (!capturesData.ok || !tracesData.ok) {
    console.error(
      "Failed to fetch user data:",
      capturesData.message,
      tracesData.message
    );
    notFound();
  }

  const captures = capturesData.data;
  const traces = tracesData.data;

  // Group captures by status
  const capturesByStatus = captures.reduce(
    (acc, capture) => {
      if (!acc[capture.status]) {
        acc[capture.status] = [];
      }
      acc[capture.status].push(capture);
      return acc;
    },
    {} as Record<CaptureStatus, typeof captures>
  );

  const totalCaptures = captures.length;
  const approvedCaptures =
    capturesByStatus[CaptureStatus.APPROVED]?.length || 0;
  const pendingCaptures = totalCaptures - approvedCaptures;

  return (
    <main className="flex flex-col grow justify-start items-center min-w-dvw min-h-dvh bg-neutral-50 dark:bg-neutral-950">
      <div className="flex w-full max-w-screen-xl p-6 gap-6">
        <ProfileCard
          user={user}
          totalCaptures={totalCaptures}
          approvedCaptures={approvedCaptures}
          pendingCaptures={pendingCaptures}
        />

        {/* Main Content */}
        <section className="flex flex-col flex-1">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your captures and traces
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/capture/new">
                <Button>
                  <Plus className="mr-2 size-4" /> New Capture
                </Button>
              </Link>
              <Link href="/candidates">
                <Button>
                  <Search className="mr-2 size-4" /> Candidate Tasks
                </Button>
              </Link>
            </div>
          </div>

          <Tabs defaultValue="captures" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="captures">Captures</TabsTrigger>
              <TabsTrigger value="traces">Traces</TabsTrigger>
            </TabsList>

            <TabsContent value="captures" className="mt-6">
              {totalCaptures > 0 ? (
                <CaptureCardColumns capturesByStatus={capturesByStatus} />
              ) : (
                <NoCapturesCard />
              )}
            </TabsContent>

            <TabsContent value="traces" className="mt-6">
              {traces.length > 0 ? (
                <TracesList traces={traces} />
              ) : (
                <NoTracesCard />
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
}
