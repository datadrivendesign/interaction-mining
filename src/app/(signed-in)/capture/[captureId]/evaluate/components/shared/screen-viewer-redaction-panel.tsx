"use client";

import type { MutableRefObject } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redactLabels } from "@/lib/utils/redact-labels";
import { cn } from "@/lib/utils";
import { Redaction } from "../../../edit/components/types";
import { isRedactionLabelled } from "../../../edit/util/redaction-completeness";
import { SeeUnderBoxesToggle } from "./screen-viewer-parts";

/** Example notes for a box, the same list the edit page offers. */
const BOX_NOTE_EXAMPLES = redactLabels
  .filter((label) => !label.requiresCustomInput)
  .map((label) => label.value);

/** The Redaction tab: the boxes on this screen, each with its note. */
export function RedactionPanel({
  boxes,
  selectedBoxId,
  onSelectBox,
  onBoxNoteChange,
  onDeleteBox,
  noteInputRefs,
  seeUnderBoxes,
  onSeeUnderBoxesChange,
}: {
  boxes: Redaction[];
  selectedBoxId: string | null;
  onSelectBox: (boxId: string) => void;
  onBoxNoteChange: (boxId: string, annotation: string) => void;
  onDeleteBox: (boxId: string) => void;
  /** Note fields by box id, so a new box can focus its field. */
  noteInputRefs: MutableRefObject<Record<string, HTMLInputElement | null>>;
  seeUnderBoxes: boolean;
  onSeeUnderBoxesChange: (checked: boolean) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Drag on the screen to cover private information. Use one box per item.
        Click a box to select it.
      </p>
      {boxes.length > 0 && (
        <SeeUnderBoxesToggle
          checked={seeUnderBoxes}
          onChange={onSeeUnderBoxesChange}
        />
      )}
      {boxes.length === 0 ? (
        <p className="text-sm text-neutral-500 italic">
          No boxes on this screen.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {boxes.map((box, index) => {
            const isSelected = box.id === selectedBoxId;
            return (
              <li
                key={box.id}
                className={cn(
                  "flex flex-col gap-2 rounded-md border p-2",
                  isSelected
                    ? "border-blue-500"
                    : "border-neutral-200 dark:border-neutral-800",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <Input
                    ref={(node) => {
                      noteInputRefs.current[box.id] = node;
                    }}
                    value={box.annotation}
                    placeholder="What it covers"
                    aria-label={`Note for box ${index + 1}`}
                    aria-invalid={!isRedactionLabelled(box)}
                    onFocus={() => onSelectBox(box.id)}
                    onChange={(event) =>
                      onBoxNoteChange(box.id, event.target.value)
                    }
                    className="h-8 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete box ${index + 1}`}
                    onClick={() => onDeleteBox(box.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {isSelected && (
                  <div className="flex flex-wrap gap-1 pl-8">
                    {BOX_NOTE_EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        // Keep focus in the note field.
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => onBoxNoteChange(box.id, example)}
                        className={cn(
                          "cursor-pointer rounded-full border px-2 py-0.5 text-xs transition-colors",
                          box.annotation === example
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800",
                        )}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
