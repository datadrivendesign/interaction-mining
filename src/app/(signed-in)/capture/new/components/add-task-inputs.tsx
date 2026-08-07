import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

export type TaskCandidate = {
  id: string;
  description: string;
  candidateOrigin?: {
    candidateTaskAppId: string;
    taskIndex: number;
  };
};

export default function AddTaskInputs({
  setTasks,
  tasks,
  maxLength,
  setLastAddedId,
  setTaskRef,
  //   updateTask,
}: {
  setTasks: Dispatch<SetStateAction<TaskCandidate[]>>;
  tasks: TaskCandidate[];
  maxLength: number;
  setLastAddedId: Dispatch<SetStateAction<string | null>>;
  setTaskRef: (id: string) => (el: HTMLTextAreaElement | null) => void;
  // updateTask: (id: string, value: string) => void;
}) {
  const makeTaskCandidate = (description = ""): TaskCandidate => ({
    id: `id_${Date.now()}_${Math.random().toString(16)}`,
    description,
  });

  const showMinusButton = tasks.length > 1;

  const addTaskAfter = (id: string) =>
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const newTask = makeTaskCandidate("");
      next.splice(idx + 1, 0, newTask);
      setLastAddedId(newTask.id); // trigger scroll + focus
      return next;
    });

  const removeTask = (id: string) =>
    setTasks((prev) => {
      if (prev.length <= 1) return prev; // keep at least one row
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });

  const updateTask = (id: string, value: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, description: value.slice(0, maxLength) } : t,
      ),
    );
  };

  return (
    <div className="w-full space-y-3">
      {tasks.map((t, i) => (
        <div
          key={t.id}
          className={`grid items-center gap-2 ${showMinusButton ? "grid-cols-[auto_1fr_auto]" : "grid-cols-[1fr_auto]"}`}
        >
          {showMinusButton && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Remove task"
              onClick={() => removeTask(t.id)}
              className="h-10 self-center"
            >
              <Minus className="size-4" />
            </Button>
          )}

          <Textarea
            className="min-h-14 resize-none"
            ref={setTaskRef(t.id)}
            value={t.description}
            onChange={(e) => updateTask(t.id, e.target.value)}
            maxLength={maxLength}
            placeholder={
              i === 0
                ? "e.g. Create a new message and attach a photo"
                : "Add another task…"
            }
            required
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Add task after"
            onClick={() => addTaskAfter(t.id)}
            className="h-10 self-center"
          >
            <Plus className="size-4" />
          </Button>

          <div className="col-span-3 text-right text-xs text-muted-foreground">
            {t.description.length}/{maxLength}
          </div>
        </div>
      ))}
    </div>
  );
}
