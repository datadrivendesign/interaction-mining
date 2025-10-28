import { Button } from "@/components/ui/button";
import { UsersPanel } from "./components/users-panel";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default async function UsersPanelPage() {
  return (
    <div className="flex flex-col w-full h-full items-center justify-center">
      <div className="space-y-4 w-full max-w-5xl">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-start">
            Manage Users
          </h1>
          {/* Action button for navigation */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-md font-bold tracking-tight">
              Navigate To:
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/tasks">
                <AlertCircle className="w-4 h-4 mr-2" />
                Review Tasks
              </Link>
            </Button>
          </div>
        </div>
        <UsersPanel />
      </div>
    </div>
  );
}
