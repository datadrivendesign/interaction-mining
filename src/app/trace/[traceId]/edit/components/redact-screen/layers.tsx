"use client";

import { useContext, useState } from "react";
import { Redaction } from "./types";
import { cn } from "@/lib/utils";
import { Layers3, Square, X } from "lucide-react";
import { RedactCanvasContext } from "./redact-screen-canvas";

export default function Layers({
  redactions,
  deleteRedaction,
}: {
  redactions: Redaction[];
  deleteRedaction: (id: string) => void;
}) {
  const { selected: selectedRedaction, selectRedaction } =
    useContext(RedactCanvasContext);
  // const [selected, setSelected] = useState<number | null>(null);
  return (
    <aside className="absolute z-10 right-4 flex flex-col justify-center items-center w-full max-w-2xs max-h-[calc(100%-2rem)] gap-2 bg-neutral-100 dark:bg-neutral-900 p-2 rounded-lg shadow-lg overflow-hidden">
      <span className="inline-flex items-center w-full text-left text-xs font-semibold">
        <Layers3 className="size-3 mr-1.5 text-neutral-500 dark:text-neutral-400" />
        Layers
      </span>
      <div className="flex flex-col w-full overflow-auto">
        {redactions.length > 0 ? (
          redactions.map((redaction, index) => (
            <div
              key={index}
              className={cn(
                "flex justify-between w-full px-2 py-1 rounded cursor-pointer",
                selectedRedaction?.id === redaction.id
                  ? "bg-blue-500 text-white"
                  : "bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
              )}
              onClick={() => selectRedaction(redaction.id)}
            >
              <span className="inline-flex items-center text-sm font-medium select-none">
                <Square className="size-3 mr-1.5" />
                {redaction.annotation && redaction.annotation !== ""
                  ? redaction.annotation
                  : `Unnamed redaction`}
              </span>
              <button>
                <X
                  className={cn(
                    selectedRedaction?.id === redaction.id
                      ? "block size-4 hover:opacity-75 transition-opacity duration-300 ease-in-out cursor-pointer"
                      : "hidden"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRedaction(redaction.id);
                  }}
                />
              </button>
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center w-full p-1 pb-2 text-neutral-500 dark:text-neutral-400">
            <span className="text-sm font-medium">No redactions</span>
          </div>
        )}
      </div>
    </aside>
  );
}
