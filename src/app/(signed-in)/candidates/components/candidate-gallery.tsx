import { CandidateTaskApp } from "@/lib/actions";
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

export const CandidateTaskGallery = ({
  filteredApps,
  search,
  isLoadingMore,
  hasMore,
  onLoadMore,
  isLoading,
}: {
  filteredApps: CandidateTaskApp[];
  search: string;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}) => {
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
      {filteredApps.length > 0 ? (
        filteredApps.map((candidateTaskApp) => (
          <CandidateGalleryAppCard
            key={candidateTaskApp.id}
            candidateTaskApp={candidateTaskApp}
            selectedAppId={selectedAppId}
            setSelectedAppId={setSelectedAppId}
          />
        ))
      ) : (
        <CandidateGalleryNoApps search={search} />
      )}
      {hasMore && (
        <div className="flex justify-center p-4">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
          >
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
          <Image
            src={candidateTaskApp.app.metadata.icon}
            alt={`${candidateTaskApp.app.metadata.name} icon`}
            width={0}
            height={0}
            sizes="100vw"
            className="flex grow-0 shrink-0 basis-12 rounded-xl mr-4 aspect-square drop-shadow-md w-1/5 h-1/5 object-cover"
            onClick={() => {
              if (selectedAppId === candidateTaskApp.id) {
                setSelectedAppId(null);
              } else {
                setSelectedAppId(candidateTaskApp.id);
              }
            }}
          />
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

const CandidateGalleryNoApps = ({ search }: { search: string }) => {
  return (
    <div className="col-span-full text-center text-muted-foreground py-8">
      {search.trim()
        ? `No apps found matching "${search}"`
        : "No candidate apps available"}
    </div>
  );
};
