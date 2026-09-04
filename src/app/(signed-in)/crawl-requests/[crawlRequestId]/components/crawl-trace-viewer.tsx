"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Keyboard,
  Lightbulb,
  Loader2,
  Maximize2,
  MousePointer,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Timer,
  AlertCircle,
  AlertTriangle,
  Brain,
  ImageIcon,
  FolderSync,
} from "lucide-react";
import type { CrawlRequest, CrawlTraceData, CrawlStep, CrawlStepAction } from "@/lib/actions/crawl-request";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CrawlTraceViewerProps {
  crawlRequest: CrawlRequest;
  trace: CrawlTraceData | null;
}

function getActionConfig(action?: CrawlStepAction) {
  const type = (action?.type || "").toLowerCase();
  switch (type) {
    case "type":
      return {
        label: action?.text ? `Type "${action.text}"` : "Type",
        badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        icon: Keyboard,
      };
    case "click":
      return {
        label: action?.target?.index !== undefined
          ? `Click #${action.target.index}`
          : "Click",
        badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        icon: MousePointer,
      };
    case "scroll":
      return {
        label: `Scroll ${action?.direction || ""}`.trim() || "Scroll",
        badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        icon: ArrowUpDown,
      };
    case "done":
      return {
        label: "Done",
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: CheckCircle2,
      };
    default:
      return {
        label: action?.type || "Action",
        badgeClass: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20",
        icon: PlayCircle,
      };
  }
}

function formatDuration(
  steps: CrawlStep[],
  createdAt?: string | Date,
  updatedAt?: string | Date,
): string {
  const totalLatencyMs = steps.reduce((acc, s) => acc + (s.latencyMs || 0), 0);
  if (totalLatencyMs > 0) {
    const totalSec = Math.round(totalLatencyMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${(totalLatencyMs / 1000).toFixed(1)}s`;
  }

  if (createdAt && updatedAt) {
    const diff = new Date(updatedAt).getTime() - new Date(createdAt).getTime();
    if (diff > 0) {
      const totalSec = Math.round(diff / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      return mins > 0 ? `${mins}m ${secs}s` : `${totalSec}s`;
    }
  }

  return "—";
}

export function CrawlTraceViewer({ crawlRequest, trace }: CrawlTraceViewerProps) {
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const steps = trace?.steps || [];
  const hasSteps = steps.length > 0;
  const activeStep: CrawlStep | undefined = steps[activeStepIndex];

  // Keyboard navigation for arrow keys
  useEffect(() => {
    if (!hasSteps) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveStepIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasSteps, steps.length]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const durationStr = formatDuration(steps, crawlRequest.createdAt, crawlRequest.updatedAt);
  const activeActionConfig = activeStep ? getActionConfig(activeStep.action) : null;
  const ActiveActionIcon = activeActionConfig?.icon;

  // Render status badge
  const renderStatusBadge = () => {
    switch (crawlRequest.status) {
      case "COMPLETED":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium px-2.5 py-0.5"
          >
            <CheckCircle2 className="size-3.5 mr-1" />
            Completed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge
            variant="outline"
            className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-medium px-2.5 py-0.5"
          >
            <AlertCircle className="size-3.5 mr-1" />
            Failed
          </Badge>
        );
      case "DISPATCHED":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium px-2.5 py-0.5"
          >
            <Loader2 className="size-3.5 mr-1 animate-spin" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 font-medium px-2.5 py-0.5"
          >
            <Clock className="size-3.5 mr-1" />
            Queued
          </Badge>
        );
    }
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="mr-1.5 size-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 gap-1 text-xs"
            >
              <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            {crawlRequest.captureId && (
              <Link href={`/capture/${crawlRequest.captureId}/edit`}>
                <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs">
                  <FolderSync className="size-3.5" />
                  View Ingested Capture
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Header Metadata Card */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-card/60 backdrop-blur-xs">
          <CardHeader className="p-4 sm:p-5 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {renderStatusBadge()}
                  <Badge variant="secondary" className="font-normal text-xs">
                    {crawlRequest.targetType}
                  </Badge>
                  {durationStr !== "—" && (
                    <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                      <Timer className="size-3" />
                      {durationStr}
                    </Badge>
                  )}
                  {hasSteps && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {steps.length} {steps.length === 1 ? "step" : "steps"}
                    </Badge>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight mt-1 truncate">
                  {crawlRequest.description}
                </h1>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <span>Target:</span>
                  <a
                    href={crawlRequest.targetInput}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-mono break-all"
                  >
                    {crawlRequest.targetInput}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Key Findings Box */}
          {trace?.findings && trace.findings.length > 0 && (
            <CardContent className="px-4 sm:px-5 pb-4 pt-0">
              <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400 mb-1.5">
                  <Lightbulb className="size-4 shrink-0 text-amber-500" />
                  <span>Agent Findings ({trace.findings.length})</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1">
                  {trace.findings.map((finding, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {finding}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Main Content Area */}
      {!hasSteps ? (
        /* Empty / Error State */
        <Card className="border-neutral-200 dark:border-neutral-800 p-8 sm:p-12 text-center">
          <div className="max-w-md mx-auto flex flex-col items-center gap-4">
            {crawlRequest.status === "FAILED" || trace?.error ? (
              <>
                <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
                  <AlertTriangle className="size-8" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">Crawl Execution Failed</h2>
                  <p className="text-sm text-muted-foreground">
                    The automated crawl encountered an error before completing or capturing interaction steps.
                  </p>
                </div>
                {(trace?.error || crawlRequest.error) && (
                  <div className="w-full text-left p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-mono text-rose-700 dark:text-rose-300 break-words whitespace-pre-wrap">
                    {trace?.error || crawlRequest.error}
                  </div>
                )}
                <div className="text-xs text-muted-foreground text-left bg-muted/40 p-3.5 rounded-md border space-y-1.5 w-full">
                  <div className="font-medium text-foreground">Troubleshooting Tips:</div>
                  <div>• Ensure the target URL is accessible without login or bot detection.</div>
                  <div>• Verify that the DCC worker daemon on D3PO/host is active and reachable.</div>
                  <div>• Check the requested goal description for clarity.</div>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <Loader2 className="size-8 animate-spin" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">
                    {crawlRequest.status === "DISPATCHED" ? "Crawl In Progress" : "Crawl Queued"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    The DCC crawler is actively processing this task. Screenshots and step-by-step reasoning will appear here as soon as they are available.
                  </p>
                </div>
                <Button onClick={handleRefresh} disabled={isRefreshing} className="gap-2 mt-2">
                  <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
                  Check Status
                </Button>
              </>
            )}
          </div>
        </Card>
      ) : (
        /* Steps View: Split Layout */
        <div className="flex flex-col gap-4">
          {/* Quick Step Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-xs font-medium text-muted-foreground shrink-0 mr-1">
              Steps:
            </span>
            {steps.map((s, idx) => {
              const isSelected = idx === activeStepIndex;
              const cfg = getActionConfig(s.action);
              const StepIcon = cfg.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all shrink-0 cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                      : "bg-background text-muted-foreground border-border hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-foreground",
                  )}
                >
                  <StepIcon className="size-3" />
                  <span>Step {idx + 1}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Panel: Step Navigation Timeline */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="font-semibold uppercase tracking-wider">
                  Timeline & Thoughts ({steps.length})
                </span>
                <span>Select a step to inspect</span>
              </div>

              <div className="flex flex-col gap-3 max-h-[750px] overflow-y-auto pr-1">
                {steps.map((step, idx) => {
                  const isSelected = idx === activeStepIndex;
                  const actionCfg = getActionConfig(step.action);
                  const Icon = actionCfg.icon;

                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveStepIndex(idx)}
                      className={cn(
                        "rounded-lg border p-3.5 transition-all cursor-pointer text-left flex flex-col gap-2.5",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                          : "border-border bg-card hover:bg-neutral-50 dark:hover:bg-neutral-900/40 hover:border-neutral-300 dark:hover:border-neutral-700",
                      )}
                    >
                      {/* Step Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {idx + 1}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1 font-normal text-xs px-2 py-0.5 truncate",
                              actionCfg.badgeClass,
                            )}
                          >
                            <Icon className="size-3 shrink-0" />
                            <span className="truncate">{actionCfg.label}</span>
                          </Badge>
                        </div>
                        {step.latencyMs !== undefined && (
                          <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                            {(step.latencyMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>

                      {/* Reasoning */}
                      {step.reason && (
                        <div className="text-xs text-foreground/90 leading-relaxed bg-background/60 p-2.5 rounded-md border border-neutral-100 dark:border-neutral-800">
                          <div className="flex items-center gap-1 font-medium text-[11px] text-blue-600 dark:text-blue-400 mb-1">
                            <Brain className="size-3" />
                            <span>Reasoning</span>
                          </div>
                          <p>{step.reason}</p>
                        </div>
                      )}

                      {/* Reflection */}
                      {step.reflection && (
                        <div className="text-xs text-muted-foreground leading-relaxed bg-background/40 p-2 rounded-md border border-neutral-100 dark:border-neutral-800">
                          <div className="flex items-center gap-1 font-medium text-[11px] text-amber-600 dark:text-amber-400 mb-0.5">
                            <Sparkles className="size-3" />
                            <span>Reflection</span>
                          </div>
                          <p>{step.reflection}</p>
                        </div>
                      )}

                      {/* Action Details */}
                      {step.action && (
                        <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2 pt-0.5">
                          {step.action.type === "type" && step.action.text && (
                            <span className="bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-full">
                              Input: &ldquo;{step.action.text}&rdquo;
                            </span>
                          )}
                          {step.action.type === "click" && step.action.target && (
                            <span className="bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-full">
                              Target: {step.action.target.index !== undefined
                                ? `index #${step.action.target.index}`
                                : JSON.stringify(step.action.target)}
                            </span>
                          )}
                          {step.action.type === "done" && (step.action.reason || step.action.status) && (
                            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded truncate max-w-full">
                              {step.action.reason || step.action.status}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Step Screenshot */}
            <div className="lg:col-span-7 flex flex-col gap-3 sticky top-4">
              <Card className="border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {/* Screenshot Header with Controls */}
                <CardHeader className="p-3.5 sm:p-4 border-b bg-muted/20 flex flex-row items-center justify-between gap-2 space-y-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">
                      Step {activeStepIndex + 1} of {steps.length}
                    </CardTitle>
                    {activeActionConfig && ActiveActionIcon && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 font-normal text-xs px-2 py-0.5 hidden sm:inline-flex",
                          activeActionConfig.badgeClass,
                        )}
                      >
                        <ActiveActionIcon className="size-3" />
                        {activeActionConfig.label}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-7"
                        onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeStepIndex === 0}
                        title="Previous Step (Left Arrow)"
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-7"
                        onClick={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                        disabled={activeStepIndex === steps.length - 1}
                        title="Next Step (Right Arrow)"
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded border">←</kbd>
                      <kbd className="px-1.5 py-0.5 bg-muted rounded border">→</kbd>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setIsFullscreenOpen(true)}
                      disabled={!activeStep?.screenshotUrl}
                      title="View Fullscreen"
                    >
                      <Maximize2 className="size-4" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Screenshot Display */}
                <CardContent className="p-3 sm:p-4 bg-neutral-950 flex flex-col items-center justify-center min-h-[440px] max-h-[700px]">
                  {activeStep?.screenshotUrl ? (
                    <div
                      className="relative group cursor-zoom-in flex items-center justify-center w-full h-full max-h-[640px] overflow-hidden rounded"
                      onClick={() => setIsFullscreenOpen(true)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeStep.screenshotUrl}
                        alt={`Screenshot for step ${activeStep.step + 1}`}
                        className="max-h-[620px] w-auto max-w-full object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01]"
                      />
                      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 pointer-events-none">
                        <Maximize2 className="size-3" />
                        Click to enlarge
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 text-neutral-400 gap-2">
                      <ImageIcon className="size-12 opacity-30" />
                      <p className="text-sm">No screenshot captured for this step.</p>
                    </div>
                  )}
                </CardContent>

                {/* Screenshot Footer */}
                {activeStep && (
                  <div className="p-3 bg-muted/10 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 truncate">
                      {activeStep.latencyMs !== undefined && (
                        <span>Latency: {(activeStep.latencyMs / 1000).toFixed(2)}s</span>
                      )}
                      {activeStep.capturedAt && (
                        <span>• Captured at: {new Date(activeStep.capturedAt).toLocaleTimeString()}</span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] truncate">
                      Action: {activeActionConfig?.label}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Screenshot Modal */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] p-4 flex flex-col gap-3">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-2">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <span>Step {activeStepIndex + 1} Screenshot</span>
              {activeActionConfig && (
                <Badge variant="outline" className={cn("text-xs font-normal", activeActionConfig.badgeClass)}>
                  {activeActionConfig.label}
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-1 pr-6">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeStepIndex === 0}
              >
                <ChevronLeft className="size-3.5 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                disabled={activeStepIndex === steps.length - 1}
              >
                Next
                <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-[500px] max-h-[80vh] flex items-center justify-center bg-black/95 rounded-md overflow-hidden p-2">
            {activeStep?.screenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeStep.screenshotUrl}
                alt={`Full size screenshot step ${activeStep.step + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-neutral-400 text-sm">No screenshot available</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
