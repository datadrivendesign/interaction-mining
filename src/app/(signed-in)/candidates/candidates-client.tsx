"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { CandidateTaskGallery } from "./components/candidate-gallery";
import { CandidateTaskSearch } from "./components/candidate-search";
import {
  CandidateTaskProvider,
  useCandidateTask,
} from "@/app/(signed-in)/candidates/components/candidate-task-context";
import { useState } from "react";

function CandidatesPageContent() {
  const { showTaken, setShowTaken, fetchCandidateTaskApps, isLoading } =
    useCandidateTask();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCandidateTaskApps();
    setIsRefreshing(false);
  };

  return (
    <div className="flex min-h-dvh w-dvw items-start justify-center p-8 md:p-16">
      <div className="flex w-full flex-col gap-4">
        <h1 className="text-2xl font-bold">Candidates</h1>
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <Switch checked={showTaken} onCheckedChange={setShowTaken} />
            <Label>Show Taken Apps</Label>
          </div>
          <Button
            className="h-full"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            {isLoading || isRefreshing ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                Refresh Apps <RefreshCcw className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        <CandidateTaskSearch />
        <CandidateTaskGallery />
      </div>
    </div>
  );
}

export function CandidatesClient() {
  return (
    <CandidateTaskProvider>
      <CandidatesPageContent />
    </CandidateTaskProvider>
  );
}
