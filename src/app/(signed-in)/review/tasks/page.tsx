import { TasksPanel } from "../../admin/tasks/components/tasks-panel";

export default async function ReviewTasksPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="w-full max-w-5xl space-y-4 2xl:max-w-7xl">
        <div className="mb-4">
          <h1 className="text-start text-3xl font-bold tracking-tight">
            Review Queue
          </h1>
          <p className="text-sm text-muted-foreground">
            Captures waiting for a reviewer. Approve sends a capture to the
            final check; Send back returns it to the worker.
          </p>
        </div>
        <TasksPanel isAdmin={false} basePath="/review/tasks" />
      </div>
    </div>
  );
}
