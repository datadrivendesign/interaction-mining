import Link from "next/link";
import { Clock, Send, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import type { CrawlRequestStatus } from "@prisma/client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
              <Link
                key={crawlRequest.id}
                href={`/crawl-requests/${crawlRequest.id}`}
                className="group flex items-center justify-between gap-3 rounded-md border border-neutral-200 dark:border-neutral-800 px-3 py-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                    {label}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {crawlRequest.description}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="secondary"
                    className={cn(
                      config.textColor,
                      "gap-1 flex items-center font-normal",
                    )}
                  >
                    <Icon className="size-3" />
                    {config.label}
                  </Badge>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

