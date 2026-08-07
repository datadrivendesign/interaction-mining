// import Globe from "@/public/globe.svg";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { cache } from "react";
import { Container, DraftingCompass } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 43200;

const fetchStats = cache(async () => {
  "use server";
  const [appsCount, tracesCount, screensCount, redactionsCount] =
    await Promise.all([
      prisma.app.count(),
      prisma.trace.count(),
      prisma.screen.count(),
      // aggregate redactions‐array lengths server‐side
      prisma.screen
        .aggregateRaw({
          pipeline: [
            // for each document, project the size of its redactions array
            {
              $project: { count: { $size: { $ifNull: ["$redactions", []] } } },
            },
            // then sum all those sizes into a single total
            { $group: { _id: null, total: { $sum: "$count" } } },
          ],
        })
        .then((res) => (res as unknown as { total: number }[])[0]?.total ?? 0),
    ]);

  return { appsCount, tracesCount, screensCount, redactionsCount };
});

export default async function Dataset() {
  const { appsCount, tracesCount, screensCount, redactionsCount } =
    await fetchStats();
  return (
    <section
      id="dataset"
      className="grid w-full max-w-screen-md grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:gap-6 lg:p-6"
    >
      <div className="col-span-1 row-span-1 flex h-full w-full rounded-3xl bg-gradient-to-br from-neutral-100 to-neutral-200 p-px dark:from-neutral-800 dark:to-neutral-900">
        <div className="flex w-full grow flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-white to-neutral-100 p-6 dark:from-neutral-900 dark:to-black">
          <div className="mb-4 flex flex-col items-start text-blue-500 dark:text-blue-400">
            <div className="mb-2 flex aspect-square size-10 items-center justify-center rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
              <Container className="size-6" />
            </div>
            <span className="font-mono font-semibold uppercase">
              The Dataset
            </span>
          </div>
          <p className="mb-4 text-3xl font-medium tracking-tight text-muted-foreground">
            A growing library of{" "}
            <span className="text-foreground">
              {formatNumber(screensCount)} screens
            </span>{" "}
            from{" "}
            <span className="text-foreground">
              {formatNumber(tracesCount)} user flows
            </span>{" "}
            across{" "}
            <span className="text-foreground">
              {formatNumber(appsCount)} apps
            </span>
            .
          </p>
          <p className="mb-8 text-3xl font-medium tracking-tight text-muted-foreground">
            <span className="text-foreground">
              {formatNumber(redactionsCount)}
            </span>{" "}
            pieces of private user data protected.
          </p>
          <Link href="/explore" className="mt-auto justify-self-end">
            <Button className="rounded-full">Explore dataset</Button>
          </Link>
        </div>
      </div>
      <div className="col-span-1 row-span-1 flex h-full w-full rounded-3xl bg-gradient-to-br from-neutral-100 to-neutral-200 p-px dark:from-neutral-800 dark:to-neutral-900">
        <div className="to-neutral- 100 flex w-full grow flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-white p-6 dark:from-neutral-900 dark:to-black">
          <div className="mb-4 flex flex-col items-start text-purple-500 dark:text-purple-400">
            <div className="mb-2 flex aspect-square size-10 items-center justify-center rounded-lg border-2 border-purple-500 bg-purple-50 dark:bg-purple-950">
              <DraftingCompass className="size-6" />
            </div>
            <span className="font-mono font-semibold uppercase">
              The Platform
            </span>
          </div>
          <p className="mb-8 w-full max-w-md text-3xl font-medium tracking-tight text-muted-foreground">
            Learn about <span className="text-foreground">contributing</span> to
            the global repository, or{" "}
            <span className="text-foreground">hosting</span> your own dataset.
          </p>
          <Link href="/contribute" className="mt-auto justify-self-end">
            <Button variant={"secondary"} className="rounded-full">
              Start contributing
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
