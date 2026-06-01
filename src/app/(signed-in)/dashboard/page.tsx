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
        captureCountsData.message,
      );
    }
    if (!createdCapturesPaginatedData.ok) {
      console.error(
        "Failed to fetch created captures:",
        createdCapturesPaginatedData.message,
      );
    }
    if (!processingCapturesPaginatedData.ok) {
      console.error(
        "Failed to fetch processing captures:",
        processingCapturesPaginatedData.message,
      );
    }
    if (!reviewingCapturesPaginatedData.ok) {
      console.error(
        "Failed to fetch reviewing captures:",
        reviewingCapturesPaginatedData.message,
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
    {} as Record<CaptureStatus, number>,
  );
  const totalCaptures = Object.values(capturesByStatus).reduce(
    (a, b) => a + (b ?? 0),
    0,
  );
  // const approvedCaptures = capturesByStatus[CaptureStatus.APPROVED] ?? 0;
  // const pendingCaptures = totalCaptures - approvedCaptures;
  const createdCaptures = capturesByStatus[CaptureStatus.CREATED] ?? 0;
  const processingCaptures = capturesByStatus[CaptureStatus.PROCESSING] ?? 0;
  const reviewingCaptures = capturesByStatus[CaptureStatus.REVIEWING] ?? 0;

  // Get initial captures by status
  const initialCapturesByStatus = {
    [CaptureStatus.CREATED]: createdCapturesPaginatedData.data,
    [CaptureStatus.PROCESSING]: processingCapturesPaginatedData.data,
    [CaptureStatus.REVIEWING]: reviewingCapturesPaginatedData.data,
  };

  return (
    <main className="flex min-h-dvh w-full grow flex-col items-center justify-start bg-neutral-50 dark:bg-neutral-950">
      <div className="flex w-full max-w-screen-2xl flex-col gap-6 p-4 sm:p-6 lg:flex-row">
        <ProfileCard
          user={user}
          createdCaptures={createdCaptures}
          processingCaptures={processingCaptures}
          reviewingCaptures={reviewingCaptures}
        />

        {/* Main Content */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your captures and traces
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link href="/capture/new" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 size-4" /> New Capture
                </Button>
              </Link>
              <Link href="/candidates" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">
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
