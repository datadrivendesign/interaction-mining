"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createCaptureTask, revalidateCaptureCaches } from "@/lib/actions";
import { Platform, prettyOS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import AddAppForm from "./add-app-form";
import AppGallery from "./app-gallery";
import { Loader2, Plus, Minus } from "lucide-react";
import AddTaskInputs, { TaskCandidate } from "./add-task-inputs";

export default function CaptureNewPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const maxLength = 200;

  const [platform, setPlatform] = useState<Platform>(Platform.IOS);
  const [app, setApp] = useState({ name: "", id: "" });

  // Multi-row description → later collapsed to a single string for capture
  const [tasks, setTasks] = useState<TaskCandidate[]>([
    {
      id: `id_${Date.now()}_${Math.random().toString(16)}`,
      description: "",
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddApp, setShowAddApp] = useState(false);

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
    if (!lastAddedId) return;
    const el = taskRefs.current[lastAddedId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
    setLastAddedId(null);
  }, [tasks, lastAddedId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
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
        });

        if (!result.ok) {
          throw new Error(`Failed to create capture task: ${result.message}`);
        }
      }
    } catch (err) {
      toast.error("Failed to create capture task. Please try again.");
      console.error(err);
    } finally {
      toast.success("Capture tasks created! Redirecting...");
      setIsSubmitting(false);
      await revalidateCaptureCaches();
      router.push(`/dashboard`);
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
                setApp({ name: "", id: "" }); // reset selected app on platform change
              }
            }}
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
          <Label htmlFor="app" className="mr-5 font-bold">
            2. Select App
          </Label>
          {app.name && <Badge>{app.name}</Badge>}
          <AppGallery platform={platform} app={app} setApp={setApp} />
          <AddAppForm
            platform={platform}
            showAddApp={showAddApp}
            setShowAddApp={setShowAddApp}
            setApp={setApp}
          />
        </div>

        {/* Tasks */}
        <div className="space-y-3 dark:text-white">
          <Label className="font-bold">
            3. Describe what task you&apos;ll perform
          </Label>

          <AddTaskInputs
            setTasks={setTasks}
            tasks={tasks}
            maxLength={maxLength}
            setLastAddedId={setLastAddedId}
            setTaskRef={setTaskRef}
          />
        </div>

        <Button
          className="dark:bg-neutral-50 dark:text-black"
          type="submit"
          disabled={!app.id || !allFilled || isSubmitting}
          aria-disabled={!app.id || !allFilled || isSubmitting}
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Start Capture
        </Button>
      </form>
    </div>
  );
}
