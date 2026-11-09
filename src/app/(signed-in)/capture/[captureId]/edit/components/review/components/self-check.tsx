"use client";

import { Checkbox } from "@/components/ui/checkbox";

/**
 * The worker's six checks before Finish, one per step of the reviewer's
 * checklist and in the same order (recording, missing screens, screen
 * timing, gesture, description, redaction). Plain wording: workers read
 * English as a second language.
 */
export const SELF_CHECK_ITEMS = [
  "The video recording shows my assigned task, from start to finish.",
  "Each step needed to finish the task has its own screen.",
  "Each screen shows the app just before I touch it. No loading, no half-drawn page.",
  "Each gesture is the right type and sits on the element I touched.",
  "Each description says what I touched, then why. Example: Tap button to save the event. No typos.",
  "All private information is covered with small boxes, one box per item.",
] as const;

export const SELF_CHECK_COUNT = SELF_CHECK_ITEMS.length;

export function emptySelfChecks(): boolean[] {
  return SELF_CHECK_ITEMS.map(() => false);
}

export type SelfCheckState = {
  checks: boolean[];
  onChange: (index: number, checked: boolean) => void;
};

/** "Check your work": six tick boxes; Finish opens when all are ticked. */
export function SelfCheck({ checks, onChange }: SelfCheckState) {
  return (
    <section
      aria-labelledby="self-check-title"
      className="mt-6 flex w-full flex-col gap-3 border-t border-neutral-200 pt-5 dark:border-neutral-800"
    >
      <div className="flex flex-col gap-1">
        <h2 id="self-check-title" className="text-sm font-semibold">
          Check your work
        </h2>
        <p className="text-xs text-muted-foreground">
          Tick each box only if it is true. A reviewer will check the same six
          things. Finish opens when all six are ticked.
        </p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {SELF_CHECK_ITEMS.map((text, index) => {
          const id = `self-check-${index + 1}`;
          return (
            <li key={id} className="flex items-start gap-2.5">
              <Checkbox
                id={id}
                checked={checks[index] ?? false}
                onCheckedChange={(value) => onChange(index, value === true)}
                className="mt-0.5"
              />
              <label
                htmlFor={id}
                className="cursor-pointer text-sm leading-snug"
              >
                {text}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
