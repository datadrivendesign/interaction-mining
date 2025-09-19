import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCandidateTask } from "../page";
import { CandidateTaskApp } from "@/lib/actions";

export const CandidateTaskGallery = () => {
  const {
    candidateTaskApps,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore,
    handleSetAppTaken,
  } = useCandidateTask();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex w-dvw min-h-dvh justify-center items-start p-8 md:p-16">
        <div className="text-muted-foreground">Loading apps...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4 p-4 lg:p-6">
      {candidateTaskApps.length > 0 ? (
        candidateTaskApps.map((candidateTaskApp) => (
          <CandidateGalleryAppCard
            key={candidateTaskApp.id}
            candidateTaskApp={candidateTaskApp}
            selectedAppId={selectedAppId}
            setSelectedAppId={setSelectedAppId}
          />
        ))
      ) : (
        <CandidateGalleryNoApps />
      )}
      {hasMore && (
        <div className="flex justify-center p-4">
          <Button onClick={loadMore} disabled={isLoadingMore} variant="outline">
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
};

const CandidateGalleryAppCard = ({
  candidateTaskApp,
  selectedAppId,
  setSelectedAppId,
}: {
  candidateTaskApp: CandidateTaskApp;
  selectedAppId: string | null;
  setSelectedAppId: (appId: string | null) => void;
}) => {
  const [copyIcon, setCopyIcon] = useState<"copy" | "check">("copy");
  const { handleSetAppTaken } = useCandidateTask();
  const handleCopy = (tasks: string[]) => {
    navigator.clipboard.writeText(tasks.join("\n"));
    setCopyIcon("check");
    setTimeout(() => {
      setCopyIcon("copy");
    }, 2000);
  };

  const handleCopyIcon = () => {
    return copyIcon === "copy" ? (
      <Copy
        className="w-4 h-4 text-muted-foreground cursor-pointer"
        onClick={() => handleCopy(candidateTaskApp.candidateTasks)}
      />
    ) : (
      <Check
        className="w-4 h-4 text-muted-foreground cursor-pointer"
        onClick={() => setCopyIcon("copy")}
      />
    );
  };

  return (
    <Collapsible open={selectedAppId === candidateTaskApp.id}>
      <div className="flex flex-col overflow-hidden p-3 items-center justify-center rounded-lg hover:shadow-md cursor-pointer">
        <CollapsibleTrigger asChild>
          <div className="relative inline-block mb-2">
            <Image
              src={candidateTaskApp.app.metadata.icon}
              alt={`${candidateTaskApp.app.metadata.name} icon`}
              width={48}
              height={48}
              sizes="100vw"
              className="rounded-xl aspect-square drop-shadow-md object-cover"
              onClick={() => {
                if (selectedAppId === candidateTaskApp.id) {
                  setSelectedAppId(null);
                } else {
                  setSelectedAppId(candidateTaskApp.id);
                }
              }}
            />
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center text-xs p-0 font-bold shadow-lg z-10 bg-blue-500 text-white"
            >
              {candidateTaskApp.candidateTasks.length}
            </Badge>
          </div>
        </CollapsibleTrigger>
        <div className="flex flex-col grow min-w-0 justify-center items-center">
          <h2 className="text-sm font-medium leading-tight tracking-tight">
            {candidateTaskApp.app.metadata.name}
          </h2>
          <div className="flex flex-wrap gap-1 mt-1">
            {candidateTaskApp.app.metadata.genre
              .slice(0, 2)
              .map((genre, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-1 py-0 h-4"
                >
                  {genre}
                </Badge>
              ))}
            {candidateTaskApp.app.metadata.genre.length > 2 && (
              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                +{candidateTaskApp.app.metadata.genre.length - 2}
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant={candidateTaskApp.isTaken ? "destructive" : "default"}
          size="sm"
          onClick={() =>
            handleSetAppTaken(candidateTaskApp.id, !candidateTaskApp.isTaken)
          }
          className="w-full text-xs"
        >
          {candidateTaskApp.isTaken ? "Mark as Available" : "Mark as Taken"}
        </Button>
        <Separator className="w-full" />
        <CollapsibleContent className="w-full mt-1 p-2 border rounded-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium leading-tight tracking-tight mb-1">
              Candidate Tasks
            </h2>
            {handleCopyIcon()}
          </div>
          <ul className="list-disc list-inside">
            {candidateTaskApp.candidateTasks.map((task, index) => (
              <li className="text-xs text-muted-foreground mb-1" key={index}>
                {task}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

const CandidateGalleryNoApps = () => {
  const { search } = useCandidateTask();
  return (
    <div className="col-span-full text-center text-muted-foreground py-8">
      {search.trim()
        ? `No apps found matching "${search}"`
        : "No candidate apps available"}
    </div>
  );
};
