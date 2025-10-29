import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { User, CaptureStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";

import { auth } from "@/lib/auth/auth";
import { getCaptureCounts, getCapturesPaginated } from "@/lib/actions";
import {
  CaptureCardColumns,
  NoCapturesCard,
} from "./components/capture-card-columns";
import { ProfileCard } from "./components/profile-card";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  const user = session.user as User;

  const [
    captureCountsData,
    createdCapturesPaginatedData,
    processingCapturesPaginatedData,
    reviewingCapturesPaginatedData,
  ] = await Promise.all([
    getCaptureCounts({ userId: user.id }),
    getCapturesPaginated({
      userId: user.id,
      status: CaptureStatus.CREATED,
      limit: 10,
      includes: { app: true, task: true },
    }),
    getCapturesPaginated({
      userId: user.id,
      status: CaptureStatus.PROCESSING,
      limit: 10,
      includes: { app: true, task: true },
    }),
    getCapturesPaginated({
      userId: user.id,
      status: CaptureStatus.REVIEWING,
      limit: 10,
      includes: { app: true, task: true },
    }),
  ]);

  if (
    !captureCountsData.ok ||
    !createdCapturesPaginatedData.ok ||
    !processingCapturesPaginatedData.ok ||
    !reviewingCapturesPaginatedData.ok
  ) {
    if (!captureCountsData.ok) {
      console.error(
        "Failed to fetch capture counts:",
        captureCountsData.message
      );
    }
    if (!createdCapturesPaginatedData.ok) {
      console.error(
        "Failed to fetch created captures:",
        createdCapturesPaginatedData.message
      );
    }
    if (!processingCapturesPaginatedData.ok) {
      console.error(
        "Failed to fetch processing captures:",
        processingCapturesPaginatedData.message
      );
    }
    if (!reviewingCapturesPaginatedData.ok) {
      console.error(
        "Failed to fetch reviewing captures:",
        reviewingCapturesPaginatedData.message
      );
    }
    notFound();
  }

  // Group captures by status
  const capturesCount = captureCountsData.data;
  const capturesByStatus = capturesCount.reduce(
    (acc, capture) => {
      if (!acc[capture.status]) {
        acc[capture.status] = capture.count;
      }
      return acc;
    },
    {} as Record<CaptureStatus, number>
  );
  const totalCaptures = Object.values(capturesByStatus).reduce(
    (a, b) => a + (b ?? 0),
    0
  );
  const approvedCaptures = capturesByStatus[CaptureStatus.APPROVED] ?? 0;
  const pendingCaptures = totalCaptures - approvedCaptures;

  // Get initial captures by status
  const initialCapturesByStatus = {
    [CaptureStatus.CREATED]: createdCapturesPaginatedData.data,
    [CaptureStatus.PROCESSING]: processingCapturesPaginatedData.data,
    [CaptureStatus.REVIEWING]: reviewingCapturesPaginatedData.data,
  };

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

          {totalCaptures > 0 ? (
            <CaptureCardColumns
              userId={user.id}
              initialCapturesByStatus={initialCapturesByStatus}
            />
          ) : (
            <NoCapturesCard />
          )}
        </section>
      </div>
    </main>
  );
}
