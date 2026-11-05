import { TasksPanel } from "./components/tasks-panel";
import { AdminNavBar } from "../components/admin-nav-bar";
import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";

export default async function TasksPanelPage() {
  const session = await auth();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="w-full max-w-5xl space-y-4 2xl:max-w-7xl">
        <div className="mb-4">
          <h1 className="text-start text-3xl font-bold tracking-tight">
            Review Tasks
          </h1>
          {/* Action button for navigation */}
          <AdminNavBar
            currentRoute={`/admin/tasks`}
            showTasksLink={false}
            showUsersLink={isAdmin(session)}
          />
        </div>
        <TasksPanel isAdmin basePath="/admin/tasks" />
      </div>
    </div>
  );
}
