import { Eraser, MousePointer2, Pencil } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Toolbar({
  mode,
  setMode,
}: {
  mode: string;
  setMode: React.Dispatch<React.SetStateAction<"pencil" | "eraser" | "select">>;
}) {
  return (
    <TooltipProvider>
      <aside className="absolute left-4 z-10 flex flex-col items-center justify-center rounded-lg bg-neutral-100 p-1 shadow-lg dark:bg-neutral-900">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setMode("select")}
              className={`rounded p-2 ${
                mode === "select"
                  ? "bg-blue-500 text-white"
                  : "text-muted-foreground"
              }`}
            >
              <MousePointer2 className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent asChild side="right" sideOffset={10}>
            <div className="flex w-full items-center justify-between gap-2 text-sm">
              <span>Selection Tool</span>
              <kbd className="rounded-sm text-muted-foreground">V</kbd>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setMode("pencil")}
              className={`rounded p-2 ${
                mode === "pencil"
                  ? "bg-blue-500 text-white"
                  : "text-muted-foreground"
              }`}
            >
              <Pencil className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent asChild side="right" sideOffset={10}>
            <div className="flex w-full items-center justify-between gap-2 text-sm">
              <span>Pencil Tool</span>
              <kbd className="rounded-sm text-muted-foreground">P</kbd>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setMode("eraser")}
              className={`rounded p-2 ${
                mode === "eraser"
                  ? "bg-blue-500 text-white"
                  : "text-muted-foreground"
              }`}
            >
              <Eraser className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent asChild side="right" sideOffset={10}>
            <div className="flex w-full items-center justify-between gap-2 text-sm">
              <span>Eraser Tool</span>
              <kbd className="rounded-sm text-muted-foreground">E</kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}
