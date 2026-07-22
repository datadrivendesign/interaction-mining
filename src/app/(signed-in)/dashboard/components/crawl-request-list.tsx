import Link from "next/link";
import { Clock, Send, AlertCircle, CheckCircle } from "lucide-react";
import type { CrawlRequestStatus } from "@prisma/client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CrawlRequest } from "@/lib/actions";

const crawlStatusConfig: Record<
  CrawlRequestStatus,
  { label: string; icon: typeof Clock; textColor: string }
> = {
  QUEUED: { label: "Queued", icon: Clock, textColor: "text-blue-500" },
  DISPATCHED: { label: "Dispatched", icon: Send, textColor: "text-yellow-500" },
  FAILED: { label: "Failed", icon: AlertCircle, textColor: "text-red-500" },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle,
    textColor: "text-green-500",
  },
};

export function CrawlRequestList({
  crawlRequests,
}: {
  crawlRequests: CrawlRequest[];
}) {
  if (crawlRequests.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="px-4 pb-3">
        <h3 className="font-semibold">Capture Trace Requests</h3>
        <p className="text-sm text-muted-foreground">
          Automated crawl requests you&apos;ve submitted
        </p>
      </CardHeader>
      <CardContent className="px-4 pt-0">
        <div className="flex flex-col gap-2">
          {crawlRequests.map((crawlRequest) => {
            const config = crawlStatusConfig[crawlRequest.status];
            const Icon = config.icon;
            const label = crawlRequest.app?.metadata.name ?? crawlRequest.targetInput;
            return (
              <div
                key={crawlRequest.id}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{label}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {crawlRequest.description}
                  </div>
                </div>
                {crawlRequest.status === "COMPLETED" &&
                crawlRequest.captureId ? (
                  <Link href={`/capture/${crawlRequest.captureId}/edit`}>
                    <Badge variant="secondary" className={config.textColor}>
                      <Icon className="size-3" />
                      {config.label}
                    </Badge>
                  </Link>
                ) : (
                  <Badge variant="secondary" className={config.textColor}>
                    <Icon className="size-3" />
                    {config.label}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
