import { ButtonGroup } from "@/components/ui/button-group";
import { TasksPanel } from "./components/tasks-panel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users } from "lucide-react";

export default async function TasksPanelPage() {
  return (
    <div className="flex flex-col w-full h-full items-center justify-center">
      <div className="space-y-4 w-full max-w-5xl">
        <div className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight text-start">
            Review Tasks
          </h1>
          {/* Action button for navigation */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-md font-bold tracking-tight">
              Navigate To:
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">
                <Users className="w-4 h-4 mr-2" />
                All Users Panel
              </Link>
            </Button>
          </div>
        </div>
        <TasksPanel />
      </div>
    </div>
  );
}
