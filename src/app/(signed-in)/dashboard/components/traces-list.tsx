import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Eye as EyeIcon } from "lucide-react";

import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { prettyOS, prettyTime } from "@/lib/utils";
import { Trace } from "@/lib/actions";

export function NoTracesCard() {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <CheckCircle className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No traces yet</h3>
        <p className="text-muted-foreground">
          Traces will appear here once you complete and approve captures.
        </p>
      </div>
    </Card>
  );
}

export function TracesList({ traces }: { traces: Trace[] }) {
  return (
    <div className="space-y-4">
      {traces.map((trace) => (
        <Card key={trace.id}>
          <CardHeader className="flex flex-row justify-between gap-4 space-y-0">
            <div className="flex gap-4">
              {trace.app?.metadata?.icon ? (
                <Image
                  src={trace.app?.metadata?.icon}
                  alt="App Icon"
                  className="w-16 h-16 rounded-2xl object-cover"
                  width={64}
                  height={64}
                />
              ) : (
                <div className="size-16 rounded-2xl bg-muted-background animate-pulse" />
              )}
              <div className="flex flex-col w-full">
                <h3 className="text-foreground font-semibold">
                  {trace.app?.metadata?.name ?? "Unnamed App"} (
                  {prettyOS(trace.task?.os)})
                </h3>
                <p className="text-sm text-muted-foreground">
                  {trace.description || "No description"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Created {prettyTime(trace.created)}
                </p>
              </div>
            </div>
            <Link href={`/app/${trace.appId}/trace/${trace.id}`}>
              <Button size="sm" variant="secondary">
                <EyeIcon className="mr-2 size-4" />
                View
              </Button>
            </Link>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
