import { Button } from "@/components/ui/button";
import { UsersPanel } from "./components/users-panel";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { AdminNavBar } from "../components/admin-nav-bar";

export default async function UsersPanelPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="w-full max-w-5xl space-y-4">
        <div className="mb-4">
          <h1 className="text-start text-3xl font-bold tracking-tight">
            Manage Users
          </h1>
          {/* Action buttons for navigation */}
          <AdminNavBar
            currentRoute={`/admin/users`}
            showTasksLink={true}
            showUsersLink={false}
          />
        </div>
        <UsersPanel />
      </div>
    </div>
  );
}
