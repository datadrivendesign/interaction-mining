"use client";

import { SetStateAction, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createCaptureTask,
  getCandidateTaskCapturePrefill,
  revalidateCaptureCaches,
} from "@/lib/actions";
import { Platform, prettyOS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import AddAppForm from "./components/add-app-form";
import AppGallery from "./components/app-gallery";
import { Loader2 } from "lucide-react";
import AddTaskInputs, { TaskCandidate } from "./components/add-task-inputs";
import { Session } from "next-auth";

type CandidateOrigin = {
  candidateTaskAppId: string;
  taskIndex: number;
};

const makeTaskCandidate = (
  description = "",
  candidateOrigin?: CandidateOrigin,
): TaskCandidate => ({
  id: `id_${Date.now()}_${Math.random().toString(16)}`,
  description,
  candidateOrigin,
});

export default function CaptureNewClient({ user }: { user: Session["user"] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const maxLength = 200;

  const [platform, setPlatform] = useState<Platform>(Platform.IOS);
  const [app, setApp] = useState({ name: "", id: "" });

  // Multi-row description → later collapsed to a single string for capture
  const [tasks, setTasks] = useState<TaskCandidate[]>([makeTaskCandidate()]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [showAddApp, setShowAddApp] = useState(false);

  const handleManualSetApp = (
    nextApp: SetStateAction<{ name: string; id: string }>,
  ) => {
    setApp(nextApp);
    setTasks((prev) =>
      // clear candidate origin when app is set manually
      prev.map(({ candidateOrigin: _candidateOrigin, ...task }) => task),
    );
  };

  const handleManualSetTasks = (nextTasks: SetStateAction<TaskCandidate[]>) => {
    setTasks(nextTasks);
  };

  // Validation: all tasks must be non-empty (trimmed)
  const allFilled = tasks.every((t) => t.description.trim().length > 0);

  // Stepper state (purely visual)
  const step = !platform ? 0 : !app.id ? 1 : !allFilled ? 2 : 3;

  // ---- focus/scroll handling for newly added task
  const taskRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const setTaskRef = (id: string) => (el: HTMLTextAreaElement | null) => {
    if (el) taskRefs.current[id] = el;
    else delete taskRefs.current[id];
  };
  useEffect(() => {
    if (!lastAddedId) {
      return;
    }
    const el = taskRefs.current[lastAddedId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
    setLastAddedId(null);
  }, [tasks, lastAddedId]);

  useEffect(() => {
    const candidateTaskAppId = searchParams.get("candidateTaskAppId");
    const taskIndexParams = searchParams.getAll("taskIndex");
    if (!candidateTaskAppId || taskIndexParams.length === 0) {
      return;
    }

    const taskIndexes = Array.from(
      new Set(taskIndexParams.map((taskIndexParam) => Number(taskIndexParam))),
    );
    if (
      taskIndexes.some(
        (taskIndex) => !Number.isInteger(taskIndex) || taskIndex < 0,
      )
    ) {
      toast.error("Invalid candidate task link.");
      return;
    }

    let ignore = false;
    setIsPrefilling(true);

    getCandidateTaskCapturePrefill({ candidateTaskAppId, taskIndexes })
      .then((result) => {
        if (ignore) return;
        if (!result.ok || !result.data) {
          toast.error(result.message || "Unable to load candidate task.");
          return;
        }

        const prefillPlatform = result.data.platform as Platform;
        if (!Object.values(Platform).includes(prefillPlatform)) {
          toast.error("Candidate task has an unsupported platform.");
          return;
        }

        setPlatform(prefillPlatform);
        setApp(result.data.app);
        setTasks(
          result.data.tasks.map((task) =>
            makeTaskCandidate(task.description, task.origin),
          ),
        );
      })
      .catch((error) => {
        if (ignore) return;
        console.error(error);
        toast.error("Unable to load candidate task.");
      })
      .finally(() => {
        if (!ignore) setIsPrefilling(false);
      });

    return () => {
      ignore = true;
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.id) {
      toast.error("User not authenticated.");
      return;
    }
    if (!allFilled) {
      toast.error("Please fill every task before starting the capture.");
      return;
    }
    setIsSubmitting(true);
    try {
      for (const task of tasks) {
        const result = await createCaptureTask({
          appId: app.id,
          os: platform,
          description: task.description,
          candidateOrigin: task.candidateOrigin,
        });

        if (!result.ok) {
          throw new Error(`Failed to create capture task: ${result.message}`);
        }
      }
      toast.success("Capture tasks created! Redirecting...");
      await revalidateCaptureCaches();
      router.push(`/dashboard`);
    } catch (err) {
      toast.error(`Failed to create capture task.`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mt-10 mx-auto space-y-8 bg-neutral-150 dark:bg-neutral-900 rounded-lg hover:shadow-2xl transition-shadow duration-300">
      <ul className="flex justify-between text-center text-sm text-muted-foreground font-medium mb-4">
        {["Platform", "Select App", "Describe Task"].map((label, index) => (
          <li
            key={label}
            className={`flex-1 transition-all duration-300 rounded-lg px-2 py-2 ${
              step > index
                ? "bg-neutral-200 dark:bg-neutral-800 text-foreground shadow-lg mr-2 dark:text-white"
                : ""
            }`}
          >
            <div className="text-lg font-bold">
              {step > index ? "☑" : index + 1}
            </div>
            <div>{label}</div>
          </li>
        ))}
      </ul>

      <div>
        <h1 className="text-4xl font-extrabold tracking-tight dark:text-white">
          Create Task Flow
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
        {/* Platform */}
        <div className="space-y-2 dark:text-white">
          <Label className="mr-3 font-bold">1. Choose Platform</Label>
          <Badge
            className={`${
              platform === Platform.ANDROID ? "bg-green-500" : "bg-blue-500"
            } text-white`}
          >
            {prettyOS(platform)}
          </Badge>
          <ToggleGroup
            type="single"
            value={platform}
            onValueChange={(selectPlatform) => {
              if (selectPlatform) {
                setPlatform(selectPlatform as Platform);
                // reset selected app on platform change
                setApp({ name: "", id: "" });
                setTasks((prev) =>
                  prev.map(
                    ({ candidateOrigin: _candidateOrigin, ...task }) => task,
                  ),
                );
              }
            }}
            disabled={isPrefilling || isSubmitting}
            className="w-full"
          >
            <ToggleGroupItem
              value={Platform.ANDROID}
              className="w-full dark:text-neutral-200 cursor-pointer"
            >
              {prettyOS(Platform.ANDROID)}
            </ToggleGroupItem>
            <ToggleGroupItem
              value={Platform.IOS}
              className="w-full dark:text-neutral-200 cursor-pointer"
            >
              {prettyOS(Platform.IOS)}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* App */}
        <div className="space-y-2 dark:text-white">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Label htmlFor="app" className="font-bold">
              2. Select App
            </Label>
            {app.name ? (
              <div className="flex max-w-full items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-2 py-1 sm:max-w-[65%]">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-muted-foreground">
                    Selected
                  </div>
                  <div className="truncate text-sm font-semibold">
                    {app.name}
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {prettyOS(platform)}
                </Badge>
              </div>
            ) : null}
          </div>
          {isPrefilling ? (
            <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading candidate task...
            </div>
          ) : null}
          <AppGallery
            platform={platform}
            app={app}
            setApp={handleManualSetApp}
          />
          <AddAppForm
            platform={platform}
            showAddApp={showAddApp}
            setShowAddApp={setShowAddApp}
            setApp={handleManualSetApp}
          />
        </div>

        {/* Tasks */}
        <div className="space-y-3 dark:text-white">
          <Label className="font-bold">
            3. Describe what task you&apos;ll perform
          </Label>

          <AddTaskInputs
            setTasks={handleManualSetTasks}
            tasks={tasks}
            maxLength={maxLength}
            setLastAddedId={setLastAddedId}
            setTaskRef={setTaskRef}
          />
        </div>

        <Button
          className="dark:bg-neutral-50 dark:text-black"
          type="submit"
          disabled={!app.id || !allFilled || isPrefilling || isSubmitting}
          aria-disabled={!app.id || !allFilled || isPrefilling || isSubmitting}
        >
          {(isPrefilling || isSubmitting) && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Start Capture
        </Button>
      </form>
    </div>
  );
}
