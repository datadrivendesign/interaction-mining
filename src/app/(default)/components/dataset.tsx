// import Globe from "@/public/globe.svg";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { cache } from "react";
import {  Container, DraftingCompass } from "lucide-react";
import { Button } from "@/components/ui/button";

export const revalidate = 43200

const fetchStats = cache(async () => {
  "use server";
  const [appsCount, tracesCount, screensCount, redactionsCount] = await Promise.all([
    prisma.app.count(),
    prisma.trace.count(),
    prisma.screen.count(),

    // aggregate redactions‐array lengths server‐side
    prisma.screen.aggregateRaw({
      pipeline: [
        // for each document, project the size of its redactions array
        { $project: { count: { $size: { $ifNull: ["$redactions", []] } } } },
        // then sum all those sizes into a single total
        { $group: { _id: null, total: { $sum: "$count" } } },
      ],
    }).then(res => ((res as unknown) as { total: number }[])[0]?.total ?? 0),
  ])

  return { appsCount, tracesCount, screensCount, redactionsCount }
});

export default async function Dataset() {
  const { appsCount, tracesCount, screensCount, redactionsCount } = await fetchStats()
  return (
    <section
      id="dataset"
      className="grid grid-cols-1 sm:grid-cols-2 w-full max-w-screen-md p-4 lg:p-6 gap-4 lg:gap-6"
    >
      <div className="flex col-span-1 row-span-1 w-full h-full p-px bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-3xl">
        <div className="flex flex-col grow w-full p-6 bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-900 dark:to-black rounded-[calc(1.5rem-1px)] overflow-hidden">
          <div className="flex flex-col items-start text-blue-500 dark:text-blue-400 mb-4">
            <div className="flex justify-center items-center size-10 mb-2 aspect-square rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
              <Container className="size-6" />
            </div>
            <span className="font-mono font-semibold uppercase">The Dataset</span>
          </div>
          <p className="text-3xl text-muted-foreground font-medium tracking-tight mb-4">
            A growing library of {" "}
            <span className="text-foreground">
              {formatNumber(screensCount)} screens
            </span>
            {" "}from{" "}
            <span className="text-foreground">{formatNumber(tracesCount)} user flows</span>
            {" "}across{" "}
            <span className="text-foreground">{formatNumber(appsCount)} apps</span>.
          </p>
          <p className="text-3xl text-muted-foreground font-medium tracking-tight mb-8">
            <span className="text-foreground">
              {formatNumber(redactionsCount)}
            </span>{" "}
            pieces of private user data protected.
          </p>
          <Link href="/explore" className="justify-self-end mt-auto">
            <Button className=" rounded-full">
              Explore dataset
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex col-span-1 row-span-1 w-full h-full p-px bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-3xl">
        <div className="flex flex-col grow w-full p-6 bg-gradient-to-br from-white to-neutral-
        100 dark:from-neutral-900 dark:to-black rounded-[calc(1.5rem-1px)] overflow-hidden">
          <div className="flex flex-col items-start text-purple-500 dark:text-purple-400 mb-4">
            <div className="flex justify-center items-center size-10 mb-2 aspect-square rounded-lg border-2 border-purple-500 bg-purple-50 dark:bg-purple-950">
              <DraftingCompass className="size-6" />
            </div>
            <span className="font-mono font-semibold uppercase">The Platform</span>
          </div>
          <p className="w-full max-w-md text-3xl text-muted-foreground font-medium tracking-tight mb-8">
            Learn about <span className="text-foreground">contributing</span> to the global repository, or <span className="text-foreground">hosting</span> your own dataset.
          </p>
          <Link href="/contribute" className="justify-self-end mt-auto">
            <Button variant={"secondary"} className="rounded-full">
              Start contributing
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}