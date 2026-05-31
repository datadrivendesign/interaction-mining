import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCandidateTask } from "@/app/(signed-in)/candidates/components/candidate-task-context";
import { CandidateTaskApp } from "@/lib/actions";
import { CandidateTask } from "@prisma/client";
import {
  Check,
  ClipboardCopy,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type CopiedState = "all" | number | null;

const WithTooltip = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

export const CandidateTaskGallery = () => {
  const { candidateTaskApps, isLoading, hasMore, loadMore, isLoadingMore } =
    useCandidateTask();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const selectedApp = useMemo(
    () => candidateTaskApps.find((app) => app.id === selectedAppId) ?? null,
    [candidateTaskApps, selectedAppId],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] w-full items-start justify-center p-8 md:p-16">
        <div className="text-muted-foreground">Loading apps...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {candidateTaskApps.length > 0 ? (
          candidateTaskApps.map((candidateTaskApp) => (
            <CandidateGalleryAppCard
              key={candidateTaskApp.id}
              candidateTaskApp={candidateTaskApp}
              onSelect={() => setSelectedAppId(candidateTaskApp.id)}
            />
          ))
        ) : (
          <CandidateGalleryNoApps />
        )}
      </div>
      {hasMore && (
        <div className="flex justify-center px-4 pb-6">
          <Button onClick={loadMore} disabled={isLoadingMore} variant="outline">
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
      <CandidateTaskDrawer
        candidateTaskApp={selectedApp}
        open={!!selectedApp}
        onOpenChange={(open) => {
          if (!open) setSelectedAppId(null);
        }}
      />
    </TooltipProvider>
  );
};

const CandidateGalleryAppCard = ({
  candidateTaskApp,
  onSelect,
}: {
  candidateTaskApp: CandidateTaskApp;
  onSelect: () => void;
}) => {
  const visibleTaskCount = candidateTaskApp.tasks.filter(
    (task) => task.status !== "hidden",
  ).length;
  const hiddenTaskCount = candidateTaskApp.tasks.length - visibleTaskCount;

  return (
    <WithTooltip label="Open task list">
      <button
        type="button"
        onClick={onSelect}
        className="flex min-h-36 cursor-pointer flex-col items-center justify-start gap-2 rounded-md border bg-background p-3 text-center transition hover:border-primary/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <div className="relative">
          <Image
            src={candidateTaskApp.app.metadata.icon}
            alt={`${candidateTaskApp.app.metadata.name} icon`}
            width={56}
            height={56}
            sizes="56px"
            className="aspect-square rounded-xl object-cover drop-shadow-sm"
          />
          <Badge className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs text-white">
            {visibleTaskCount}
          </Badge>
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="min-h-10 max-w-full break-all text-sm font-medium leading-tight">
            {candidateTaskApp.app.metadata.name}
          </h2>
          <div className="flex flex-wrap justify-center gap-1">
            {candidateTaskApp.app.metadata.genre
              .slice(0, 2)
              .map((genre, index) => (
                <Badge
                  key={`${genre}-${index}`}
                  variant="outline"
                  className="h-5 px-1 text-xs"
                >
                  {genre}
                </Badge>
              ))}
          </div>
          {hiddenTaskCount > 0 ? (
            <div className="text-xs text-muted-foreground">
              {hiddenTaskCount} hidden
            </div>
          ) : null}
        </div>
      </button>
    </WithTooltip>
  );
};

const CandidateTaskDrawer = ({
  candidateTaskApp,
  open,
  onOpenChange,
}: {
  candidateTaskApp: CandidateTaskApp | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { handleSetAppTaken, handleSetTaskStatus } = useCandidateTask();
  const [copied, setCopied] = useState<CopiedState>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [pendingTaskIndex, setPendingTaskIndex] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  const hiddenCount =
    candidateTaskApp?.tasks.filter((task) => task.status === "hidden").length ??
    0;
  const visibleTasks =
    candidateTaskApp?.tasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => showHidden || task.status !== "hidden") ?? [];
  const visibleTaskDescriptions = candidateTaskApp
    ? candidateTaskApp.tasks
        .filter((task) => task.status !== "hidden")
        .map((task) => task.description)
    : [];

  useEffect(() => {
    setCopied(null);
    setShowHidden(false);
    setPendingTaskIndex(null);
    setIsClaiming(false);
  }, [candidateTaskApp?.id]);

  const copyText = async (text: string, copiedState: CopiedState) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(copiedState);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error("Unable to copy task text.");
    }
  };

  const handleTaskStatus = async (
    taskIndex: number,
    status: "open" | "hidden",
  ) => {
    if (!candidateTaskApp) return;
    setPendingTaskIndex(taskIndex);
    const ok = await handleSetTaskStatus(
      candidateTaskApp.id,
      taskIndex,
      status,
    );
    setPendingTaskIndex(null);
    if (ok && status === "open" && hiddenCount <= 1) {
      setShowHidden(false);
    }
  };

  const handleClaim = async () => {
    if (!candidateTaskApp) return;
    setIsClaiming(true);
    await handleSetAppTaken(candidateTaskApp.id, !candidateTaskApp.isTaken);
    setIsClaiming(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-none flex-col p-0 sm:max-w-xl"
      >
        {candidateTaskApp ? (
          <>
            <SheetHeader className="border-b px-5 py-4 text-left">
              <div className="flex items-start gap-3 pr-8">
                <Image
                  src={candidateTaskApp.app.metadata.icon}
                  alt={`${candidateTaskApp.app.metadata.name} icon`}
                  width={48}
                  height={48}
                  sizes="48px"
                  className="aspect-square rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate">
                    {candidateTaskApp.app.metadata.name}
                  </SheetTitle>
                  <SheetDescription>
                    {visibleTaskDescriptions.length} available tasks
                    {hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ""}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-3">
                <WithTooltip label="Copy all visible tasks">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      copyText(visibleTaskDescriptions.join("\n"), "all")
                    }
                    disabled={visibleTaskDescriptions.length === 0}
                    variant="outline"
                  >
                    {copied === "all" ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    Copy all
                  </Button>
                </WithTooltip>
                <WithTooltip
                  label={
                    candidateTaskApp.isTaken
                      ? "Return this app to the available list"
                      : "Reserve this app for yourself"
                  }
                >
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleClaim}
                    disabled={isClaiming}
                    variant={
                      candidateTaskApp.isTaken ? "destructive" : "default"
                    }
                  >
                    {isClaiming
                      ? "Saving..."
                      : candidateTaskApp.isTaken
                        ? "Mark available"
                        : "Claim app"}
                  </Button>
                </WithTooltip>
              </div>
            </SheetHeader>
            <div className="border-b px-5 py-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <SourceBadge generated={false} />
                <SourceBadge generated />
              </div>
            </div>
            {hiddenCount > 0 ? (
              <div className="border-b px-5 py-3">
                <WithTooltip
                  label={showHidden ? "Hide hidden tasks" : "Show hidden tasks"}
                >
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowHidden((prev) => !prev)}
                  >
                    {showHidden ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                    {showHidden
                      ? "Hide hidden"
                      : `Show hidden (${hiddenCount})`}
                  </Button>
                </WithTooltip>
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {visibleTasks.length > 0 ? (
                <div className="space-y-3">
                  {visibleTasks.map(({ task, index }) => (
                    <CandidateTaskRow
                      key={`${candidateTaskApp.id}-${index}`}
                      task={task}
                      index={index}
                      copied={copied}
                      pending={pendingTaskIndex === index}
                      onCopy={() => copyText(task.description, index)}
                      onStatusChange={(status) =>
                        handleTaskStatus(index, status)
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No visible tasks for this app.
                </div>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

const CandidateTaskRow = ({
  task,
  index,
  copied,
  pending,
  onCopy,
  onStatusChange,
}: {
  task: CandidateTask;
  index: number;
  copied: CopiedState;
  pending: boolean;
  onCopy: () => void;
  onStatusChange: (status: "open" | "hidden") => void;
}) => {
  const isHidden = task.status === "hidden";

  return (
    <div
      className={`rounded-md border p-2.5 ${
        isHidden ? "bg-muted/40 text-muted-foreground" : "bg-background"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <SourceBadge generated={task.generated} />
          <p className="mt-1.5 text-sm leading-5">{task.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <WithTooltip label="Copy task">
            <Button type="button" size="icon" variant="ghost" onClick={onCopy}>
              {copied === index ? (
                <Check className="size-4" />
              ) : (
                <ClipboardCopy className="size-4" />
              )}
              <span className="sr-only">Copy task</span>
            </Button>
          </WithTooltip>
          {isHidden ? (
            <WithTooltip label="Restore this task to the visible list">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => onStatusChange("open")}
                className="h-8 px-2"
              >
                <Eye className="size-4" />
                {pending ? "..." : "Restore"}
              </Button>
            </WithTooltip>
          ) : (
            <WithTooltip label="Hide this task if it does not work">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => onStatusChange("hidden")}
                className="h-8 px-2"
              >
                <EyeOff className="size-4" />
                {pending ? "..." : "Hide"}
              </Button>
            </WithTooltip>
          )}
        </div>
      </div>
    </div>
  );
};

const SourceBadge = ({ generated }: { generated: boolean }) => {
  if (generated) {
    return (
      <WithTooltip label="Task suggested by AI from the app description. Hide it if it does not work.">
        <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200">
          <Sparkles className="size-3" />
          AI-generated task
        </Badge>
      </WithTooltip>
    );
  }

  return (
    <WithTooltip label="Task found in existing app data.">
      <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200">
        <Check className="size-3" />
        App task
      </Badge>
    </WithTooltip>
  );
};

const CandidateGalleryNoApps = () => {
  const { search } = useCandidateTask();
  return (
    <div className="col-span-full text-center text-muted-foreground py-8">
      {search.trim()
        ? `No apps found matching "${search}"`
        : "No candidate apps available"}
    </div>
  );
};
