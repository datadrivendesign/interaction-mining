"use client";

import { useContext } from "react";
import { Redaction } from "../../types";
import { cn } from "@/lib/utils";
import { Layers3, Square, X } from "lucide-react";
import { RedactCanvasContext } from "./redact-screen-canvas";

export default function Layers({
  redactions,
  deleteRedaction,
}: {
  redactions: Redaction[];
  deleteRedaction: (ids: string[]) => void;
}) {
  const { selected: selectedRedactions, selectRedaction } =
    useContext(RedactCanvasContext);
  return (
    <aside className="absolute right-4 z-10 flex h-full max-h-[calc(100%-2rem)] w-full max-w-3xs grow flex-col items-center justify-start gap-2 overflow-hidden rounded-lg border border-neutral-200 bg-background p-4 shadow-lg dark:border-neutral-800">
      <div className="flex w-full flex-col gap-2">
        <span className="inline-flex w-full items-center text-left text-xs font-semibold">
          <Layers3 className="mr-1.5 size-3 text-muted-foreground" />
          Layers
        </span>
        <div className="flex w-full flex-col overflow-auto">
          {redactions.length > 0 ? (
            redactions.map((redaction, index) => (
              <div
                key={index}
                className={cn(
                  "flex w-full cursor-pointer justify-between rounded px-2 py-1",
                  selectedRedactions.some((r) => r.id === redaction.id)
                    ? "bg-blue-500 text-white"
                    : "bg-transparent text-muted-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800",
                )}
                onClick={() => selectRedaction(redaction.id, false)}
              >
                <span className="inline-flex items-center text-xs font-medium select-none">
                  <Square className="mr-2 size-3" />
                  {redaction.annotation && redaction.annotation !== ""
                    ? redaction.annotation
                    : `Unnamed redaction`}
                </span>
                <button>
                  <X
                    className={cn(
                      selectedRedactions.some((r) => r.id === redaction.id)
                        ? "block size-4 cursor-pointer transition-opacity duration-300 ease-in-out hover:opacity-75"
                        : "hidden",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRedaction([redaction.id]);
                    }}
                  />
                </button>
              </div>
            ))
          ) : (
            <div className="flex w-full items-center justify-center p-1 pb-2 text-muted-foreground">
              <span className="text-sm font-medium">No redactions</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
