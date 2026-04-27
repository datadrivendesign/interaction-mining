import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Eraser, MousePointer2, MousePointerClick, Pencil } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Kbd from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const shortcutRows = [
  {
    key: "multi-select",
    shortcut: (
      <span className="flex items-center gap-1">
        <Kbd className="rounded-sm text-muted-foreground">Shift</Kbd>
        <span className="text-[10px] text-muted-foreground">+</span>
        <Kbd className="rounded-sm px-1.5 text-muted-foreground">Click</Kbd>
        {/* <MousePointerClick className="size-4" /> */}
      </span>
    ),
    label: "Multi-select",
  },
  {
    key: "copy-paste",
    shortcut: (
      <span className="flex items-center gap-1">
        <Kbd className="rounded-sm text-muted-foreground">Ctrl+C</Kbd>
        <span className="text-[10px] text-muted-foreground">/</span>
        <Kbd className="rounded-sm text-muted-foreground">Ctrl+V</Kbd>
      </span>
    ),
    label: "Copy/Paste",
  },
  {
    key: "delete",
    shortcut: <Kbd className="rounded-sm text-muted-foreground">Delete</Kbd>,
    label: "Delete",
  },
  {
    key: "close",
    shortcut: <Kbd className="rounded-sm text-muted-foreground">Esc</Kbd>,
    label: "Close",
  },
] as const;

const toolButtons = [
  {
    key: "select",
    mode: "select" as const,
    icon: MousePointer2,
    label: "Move",
    shortcut: "V",
  },
  {
    key: "pencil",
    mode: "pencil" as const,
    icon: Pencil,
    label: "Redact",
    shortcut: "P",
  },
  {
    key: "eraser",
    mode: "eraser" as const,
    icon: Eraser,
    label: "Erase",
    shortcut: "E",
  },
] as const;

const ToolButtonsSection = ({
  mode,
  setMode,
}: {
  mode: string;
  setMode: React.Dispatch<React.SetStateAction<"pencil" | "eraser" | "select">>;
}) => {
  return (
    <div className="rounded-md border border-sky-200/80 bg-sky-50/95 px-2 py-2 shadow-sm dark:border-sky-800 dark:bg-sky-900/95">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Tools
      </div>
      <div className="flex flex-row items-center justify-evenly w-full">
        {toolButtons.map((tool) => {
          const Icon = tool.icon;
          const isActive = mode === tool.mode;

          return (
            <div
              key={tool.key}
              className="flex flex-col items-center justify-center"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMode(tool.mode)}
                className={cn(
                  "size-8 rounded-sm border border-transparent cursor-pointer",
                  isActive
                    ? "bg-blue-500 text-white hover:bg-blue-500 hover:text-white"
                    : "text-muted-foreground hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70",
                )}
              >
                <Icon className="size-4" />
              </Button>
              <div className="flex flex-col items-center justify-between text-sm">
                <span className="text-center text-[10px] font-medium">
                  {tool.label}
                </span>
                <Kbd className="rounded-sm text-muted-foreground">
                  {tool.shortcut}
                </Kbd>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ShortcutsSection = () => {
  return (
    <div className="rounded-md px-1 py-1.5">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Shortcuts
      </div>
      <div className="space-y-1.5">
        {shortcutRows.map((item) => (
          <div
            key={item.key}
            className="flex min-w-0 items-center gap-2 text-[10px] font-medium leading-none text-muted-foreground"
          >
            <div className="flex h-6 w-[8rem] shrink-0 items-center justify-center">
              {item.shortcut}
            </div>
            <div className="min-w-0 flex-1 text-center leading-tight">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Toolbar({
  mode,
  setMode,
}: {
  mode: string;
  setMode: React.Dispatch<React.SetStateAction<"pencil" | "eraser" | "select">>;
}) {
  return (
    <TooltipProvider delayDuration={0}>
      <Card className="pointer-events-auto absolute left-3 top-3 z-20 h-fit w-56 max-w-[calc(100vw-1.5rem)] rounded-md border bg-background p-0 shadow-md">
        <CardHeader className="flex flex-col items-start gap-2 p-1.5">
          <CardDescription className="w-full space-y-2">
            <ToolButtonsSection mode={mode} setMode={setMode} />
            <ShortcutsSection />
          </CardDescription>
        </CardHeader>
      </Card>
    </TooltipProvider>
  );
}
