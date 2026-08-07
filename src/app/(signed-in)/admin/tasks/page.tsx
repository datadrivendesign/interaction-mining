import { TasksPanel } from "./components/tasks-panel";
import { AdminNavBar } from "../components/admin-nav-bar";

export default async function TasksPanelPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="w-full max-w-5xl space-y-4">
        <div className="mb-4">
          <h1 className="text-start text-3xl font-bold tracking-tight">
            Review Tasks
          </h1>
          {/* Action button for navigation */}
          <AdminNavBar
            currentRoute={`/admin/tasks`}
            showTasksLink={false}
            showUsersLink={true}
          />
        </div>
        <TasksPanel />
      </div>
    </div>
  );
}
