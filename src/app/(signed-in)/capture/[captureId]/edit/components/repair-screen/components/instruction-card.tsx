import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Switch } from "@/components/ui/switch";

export const InstructionCardIOS = ({
  taskDescription,
}: {
  taskDescription: string | undefined;
}) => {
  return (
    <Card
      key="task"
      className={
        "h-fit w-52 max-w-[calc(100vw-2rem)] p-0 shadow-md sm:w-56 lg:w-64 bg-background border rounded-md pointer-events-auto"
      }
    >
      <CardHeader className="flex flex-col items-start p-2">
        <CardDescription>
          <div className="w-full rounded-md border border-neutral-200/80 bg-neutral-50/95 px-2.5 py-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/95">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Task
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs font-medium leading-snug text-neutral-900 dark:text-neutral-100">
              {taskDescription ?? "No task provided."}
            </p>
          </div>
          <p className="mt-2 text-[11px] font-semibold leading-snug text-muted-foreground lg:text-xs">
            Shortcuts: Arrow Left / Right to move between screens. Tab to move
            to next card input.
          </p>
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
  return (
    <Card
      key="task"
      className={
        "h-fit w-64 max-w-[calc(100vw-2rem)] p-0 shadow-md sm:w-72 lg:w-80 bg-background border rounded-md pointer-events-auto"
      }
    >
      <CardHeader className="flex flex-col items-start p-2">
        <CardDescription>
          <div className="w-full rounded-md border border-neutral-200/80 bg-neutral-50/95 px-2.5 py-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/95">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Task
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs font-medium leading-snug text-neutral-900 dark:text-neutral-100">
              {taskDescription ?? "No task provided."}
            </p>
          </div>
          <p className="mt-2 text-[11px] font-semibold leading-snug text-muted-foreground lg:text-xs">
            Shortcuts: Tab / Left / Right to move between screens
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Switch
              checked={showBoxes}
              onCheckedChange={(checked) => {
                setShowBoxes(checked);
              }}
            />
            <span className="text-xs font-medium">Show Bounding Boxes</span>
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
