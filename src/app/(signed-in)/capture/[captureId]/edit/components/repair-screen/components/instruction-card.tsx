"use client";

import { useEffect, useState } from "react";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Delete, SquareArrowLeft, SquareArrowRight } from "lucide-react";
import Kbd from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

const shortcutChips = [
  {
    key: "screens",
    shortcut: (
      <span className="flex items-center gap-1">
        <Kbd>
          <SquareArrowLeft className="size-4" />
        </Kbd>
        <Kbd>
          <SquareArrowRight className="size-4" />
        </Kbd>
      </span>
    ),
    label: "Navigate screens",
  },
  {
    key: "tab",
    shortcut: <Kbd className="rounded-sm text-muted-foreground">Tab</Kbd>,
    label: "Next input",
  },
  {
    key: "delete",
    shortcut: (
      <span className="border-border flex items-center justify-center rounded-sm border bg-background px-1.5 py-0.5 text-muted-foreground shadow-xs">
        <Delete className="size-4" />
      </span>
    ),
    label: "Delete screen",
  },
  {
    key: "replay",
    shortcut: <Kbd className="rounded-sm text-muted-foreground">R</Kbd>,
    label: "Replay selected screen",
  },
] as const;

const COMPACT_VIEWPORT_HEIGHT = 820;

function useCompactInstructionCard() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const updateCompactMode = () => {
      const nextIsCompact = window.innerHeight <= COMPACT_VIEWPORT_HEIGHT;
      setIsCompact(nextIsCompact);
    };

    updateCompactMode();
    window.addEventListener("resize", updateCompactMode);
    return () => {
      window.removeEventListener("resize", updateCompactMode);
    };
  }, []);

  return {
    isCompact,
  };
}

function ShortcutSection({
  rows,
  isCompact,
}: {
  rows: typeof shortcutChips;
  isCompact: boolean;
}) {
  return (
    <div className={cn("rounded-md px-2 py-1.5", isCompact && "px-1.5 py-1")}>
      <div
        className={cn(
          "mb-1 flex items-center justify-between gap-2",
          isCompact && "mb-0.5 gap-1.5",
        )}
      >
        <div
          className={cn(
            "text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase",
            isCompact && "text-[9px]",
          )}
        >
          Shortcuts
        </div>
      </div>
      <div className={cn("space-y-1.5", isCompact && "space-y-1")}>
        {rows.map((item) => (
          <div
            key={item.key}
            className={cn(
              "flex min-w-0 items-center gap-2 text-[11px] leading-none font-medium text-muted-foreground",
              isCompact && "gap-1.5 text-[10px]",
            )}
          >
            <div
              className={cn(
                "flex h-6 w-[5.25rem] shrink-0 items-center justify-center",
                isCompact && "h-5 w-[4.4rem]",
              )}
            >
              {item.shortcut}
            </div>
            <div className="min-w-0 flex-1 text-center leading-tight">
              {item.label}
            </div>
          </div>
        ))}
      </div>
      <p
        className={cn(
          "sr-only text-[11px] leading-snug text-muted-foreground",
          isCompact && "text-[10px]",
        )}
      >
        Keyboard shortcuts are always visible.
      </p>
    </div>
  );
}

export const InstructionCardIOS = ({
  taskDescription,
}: {
  taskDescription: string | undefined;
}) => {
  const { isCompact } = useCompactInstructionCard();

  return (
    <Card
      key="task"
      className={cn(
        "pointer-events-auto h-fit max-w-[calc(100vw-2rem)] rounded-md border bg-background p-0 shadow-md",
        isCompact ? "w-40 sm:w-40 lg:w-40" : "w-48 sm:w-52 lg:w-56",
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-col items-start gap-1 p-1",
          isCompact && "gap-0.5 p-0.5",
        )}
      >
        <CardDescription>
          <div className={cn("w-full space-y-2", isCompact && "space-y-1")}>
            <div
              className={cn(
                "rounded-md border border-sky-200/80 bg-sky-50/95 px-2.5 py-2 shadow-sm dark:border-sky-800 dark:bg-sky-900/95",
                isCompact && "px-2 py-1.5",
              )}
            >
              <p
                className={cn(
                  "text-[11px] font-bold tracking-[0.08em] text-muted-foreground text-neutral-600 uppercase dark:text-neutral-400",
                  isCompact && "text-[10px]",
                )}
              >
                Task
              </p>
              <p
                className={cn(
                  "mt-1 text-xs leading-snug font-medium whitespace-pre-wrap text-neutral-900 dark:text-neutral-100",
                  isCompact && "mt-0.5 text-[11px] leading-[1.3]",
                )}
              >
                {taskDescription ?? "No task provided."}
              </p>
            </div>

            <ShortcutSection rows={shortcutChips} isCompact={isCompact} />
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export const InstructionCardAndroid = ({
  taskDescription,
  showBoxes,
  setShowBoxes,
}: {
  taskDescription: string | undefined;
  showBoxes: boolean;
  setShowBoxes: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isCompact } = useCompactInstructionCard();

  return (
    <Card
      key="task"
      className={cn(
        "pointer-events-auto h-fit max-w-[calc(100vw-2rem)] rounded-md border bg-background p-0 shadow-md",
        isCompact ? "w-40 sm:w-40 lg:w-40" : "w-48 sm:w-54 lg:w-60",
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-col items-start gap-2 p-2",
          isCompact && "gap-1 p-1",
        )}
      >
        <CardDescription>
          <div className={cn("w-full space-y-2", isCompact && "space-y-1")}>
            <div
              className={cn(
                "rounded-md border border-sky-200/80 bg-sky-50/95 px-2.5 py-2 shadow-sm dark:border-sky-800 dark:bg-sky-900/95",
                isCompact && "px-2 py-1.5",
              )}
            >
              <p
                className={cn(
                  "text-[10px] font-bold tracking-[0.08em] text-muted-foreground text-neutral-600 uppercase",
                  isCompact && "text-[9px]",
                )}
              >
                Task
              </p>
              <p
                className={cn(
                  "mt-1 text-xs leading-snug font-medium whitespace-pre-wrap text-neutral-900 dark:text-neutral-100",
                  isCompact && "mt-0.5 text-[11px] leading-[1.3]",
                )}
              >
                {taskDescription ?? "No task provided."}
              </p>
            </div>

            <ShortcutSection rows={shortcutChips} isCompact={isCompact} />
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
