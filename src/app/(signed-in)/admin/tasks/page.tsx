import { TasksPanel } from "./components/tasks-panel";
import { AdminNavBar } from "../components/admin-nav-bar";

export default async function TasksPanelPage() {
  return (
    <div className="flex flex-col w-full h-full items-center justify-center">
      <div className="space-y-4 w-full max-w-5xl">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-start">
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
