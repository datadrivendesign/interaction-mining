import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  ListChecks,
  Play,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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
        className="hover:border-primary/50 focus:ring-primary flex min-h-36 cursor-pointer flex-col items-center justify-start gap-2 rounded-md border bg-background p-3 text-center transition hover:shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
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
          <Badge className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs text-white">
            {visibleTaskCount}
          </Badge>
        </div>
        <div className="min-w-0 space-y-1">
          <h2 className="min-h-10 max-w-full text-sm leading-tight font-medium break-all">
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
  const [openedTaskIndexes, setOpenedTaskIndexes] = useState<Set<number>>(
    () => new Set(),
  );
  const [selectedTaskIndexes, setSelectedTaskIndexes] = useState<Set<number>>(
    () => new Set(),
  );

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
  const selectedTaskIndexesList = Array.from(selectedTaskIndexes).sort(
    (a, b) => a - b,
  );
  const selectedCaptureHref =
    candidateTaskApp && selectedTaskIndexesList.length > 0
      ? `/capture/new?candidateTaskAppId=${candidateTaskApp.id}&${selectedTaskIndexesList
          .map((taskIndex) => `taskIndex=${taskIndex}`)
          .join("&")}`
      : "/capture/new";

  useEffect(() => {
    setCopied(null);
    setShowHidden(false);
    setPendingTaskIndex(null);
    setIsClaiming(false);
    setOpenedTaskIndexes(new Set());
    setSelectedTaskIndexes(new Set());
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
    const currentStatus = candidateTaskApp.tasks[taskIndex]?.status;
    const nextHiddenCount =
      currentStatus === status
        ? hiddenCount
        : status === "hidden"
          ? hiddenCount + 1
          : currentStatus === "hidden"
            ? Math.max(0, hiddenCount - 1)
            : hiddenCount;

    setPendingTaskIndex(taskIndex);
    const ok = await handleSetTaskStatus(
      candidateTaskApp.id,
      taskIndex,
      status,
    );
    setPendingTaskIndex(null);
    if (ok && status === "hidden") {
      setSelectedTaskIndexes((prev) => {
        const next = new Set(prev);
        next.delete(taskIndex);
        return next;
      });
    }
    if (ok && status === "open" && nextHiddenCount <= 1) {
      setShowHidden(false);
    }
  };

  const handleClaim = async () => {
    if (!candidateTaskApp) return;
    setIsClaiming(true);
    await handleSetAppTaken(candidateTaskApp.id, !candidateTaskApp.isTaken);
    setIsClaiming(false);
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
                {selectedTaskIndexesList.length > 0 ? (
                  <WithTooltip label="Create captures for selected tasks in a new tab">
                    <Button asChild type="button" size="sm">
                      <Link
                        href={selectedCaptureHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          setOpenedTaskIndexes((prev) => {
                            const next = new Set(prev);
                            selectedTaskIndexesList.forEach((taskIndex) =>
                              next.add(taskIndex),
                            );
                            return next;
                          })
                        }
                      >
                        <ListChecks className="size-4" />
                        Start selected ({selectedTaskIndexesList.length})
                      </Link>
                    </Button>
                  </WithTooltip>
                ) : null}
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
                      candidateTaskAppId={candidateTaskApp.id}
                      opened={openedTaskIndexes.has(index)}
                      selected={selectedTaskIndexes.has(index)}
                      copied={copied}
                      pending={pendingTaskIndex === index}
                      onSelectedChange={(checked) =>
                        setSelectedTaskIndexes((prev) => {
                          const next = new Set(prev);
                          if (checked) {
                            next.add(index);
                          } else {
                            next.delete(index);
                          }
                          return next;
                        })
                      }
                      onOpenCapture={() =>
                        setOpenedTaskIndexes((prev) => {
                          const next = new Set(prev);
                          next.add(index);
                          return next;
                        })
                      }
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
  candidateTaskAppId,
  opened,
  selected,
  copied,
  pending,
  onSelectedChange,
  onOpenCapture,
  onCopy,
  onStatusChange,
}: {
  task: CandidateTask;
  index: number;
  candidateTaskAppId: string;
  opened: boolean;
  selected: boolean;
  copied: CopiedState;
  pending: boolean;
  onSelectedChange: (checked: boolean) => void;
  onOpenCapture: () => void;
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
        {!isHidden ? (
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectedChange(checked === true)}
            aria-label="Select task"
            className="mt-1 cursor-pointer"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <SourceBadge generated={task.generated} />
          <p className="mt-1.5 text-sm leading-5">{task.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!isHidden ? (
            <WithTooltip
              label={
                opened
                  ? "Capture form opened in a new tab"
                  : "Create a capture with this app and task prefilled"
              }
            >
              <Button
                asChild
                type="button"
                size="sm"
                variant={opened ? "outline" : "default"}
                className="h-8 px-2"
              >
                <Link
                  href={`/capture/new?candidateTaskAppId=${candidateTaskAppId}&taskIndex=${index}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onOpenCapture}
                >
                  {opened ? (
                    <Check className="size-4" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  {opened ? "Opened" : "Start"}
                </Link>
              </Button>
            </WithTooltip>
          ) : null}
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
        <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-200 hover:text-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900 dark:hover:text-amber-200">
          <Sparkles className="size-3" />
          AI-generated task
        </Badge>
      </WithTooltip>
    );
  }

  return (
    <WithTooltip label="Task found in existing app data.">
      <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-200 hover:text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900 dark:hover:text-emerald-200">
        <Check className="size-3" />
        App task
      </Badge>
    </WithTooltip>
  );
};

const CandidateGalleryNoApps = () => {
  const { search } = useCandidateTask();
  return (
    <div className="col-span-full py-8 text-center text-muted-foreground">
      {search.trim()
        ? `No apps found matching "${search}"`
        : "No candidate apps available"}
    </div>
  );
};
