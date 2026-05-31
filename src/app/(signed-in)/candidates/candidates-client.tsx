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
    <div className="flex w-dvw min-h-dvh justify-center items-start p-8 md:p-16">
      <div className="flex flex-col gap-4 w-full">
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
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                Refresh Apps <RefreshCcw className="w-4 h-4" />
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
