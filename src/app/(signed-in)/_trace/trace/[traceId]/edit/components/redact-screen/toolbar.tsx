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
      <aside className="absolute z-10 left-4 flex flex-col justify-center items-center bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg shadow-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setMode("select")}
              className={`p-2 rounded ${
                mode === "select"
                  ? "bg-blue-500 text-white"
                  : "text-muted-foreground"
              }`}
            >
              <MousePointer2 className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent asChild side="right" sideOffset={10}>
            <div className="flex w-full justify-between items-center gap-2 text-sm">
              <span>Selection Tool</span>
              <kbd className="text-muted-foreground rounded-sm">
                V
              </kbd>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setMode("pencil")}
              className={`p-2 rounded ${
                mode === "pencil"
                  ? "bg-blue-500 text-white"
                  : "text-muted-foreground"
              }`}
            >
              <Pencil className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent asChild side="right" sideOffset={10}>
            <div className="flex w-full justify-between items-center gap-2 text-sm">
              <span>Pencil Tool</span>
              <kbd className="text-muted-foreground rounded-sm">
                P
              </kbd>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setMode("eraser")}
              className={`p-2 rounded ${
                mode === "eraser"
                  ? "bg-blue-500 text-white"
                  : "text-muted-foreground"
              }`}
            >
              <Eraser className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent asChild side="right" sideOffset={10}>
            <div className="flex w-full justify-between items-center gap-2 text-sm">
              <span>Eraser Tool</span>
              <kbd className="text-muted-foreground rounded-sm">
                E
              </kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}
