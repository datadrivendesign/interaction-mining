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
        "hidden lg:block right-4 absolute top-0 w-64 p-0 z-10 shadow-md bg-background border rounded-md h-fit"
      }
    >
      <CardHeader className="flex flex-col items-center p-2">
        <CardDescription>
          <Badge>
            <article className="prose prose-neutral dark:prose-invert leading-snug text-sm font-semibold text-white dark:text-neutral-900 w-full whitespace-pre-wrap">
              <p>
                Task:{" "}
                <span className="text-xs">
                  {taskDescription ?? "No task provided."}
                </span>
              </p>
            </article>
          </Badge>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
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
        "hidden lg:block right-4 absolute top-0 w-64 p-0 z-10 shadow-md bg-background border rounded-md h-fit"
      }
    >
      <CardHeader className="flex flex-col items-center p-2">
        <CardDescription>
          <Badge>
            <article className="prose prose-neutral dark:prose-invert leading-snug text-sm font-semibold text-white dark:text-neutral-900 w-full whitespace-pre-wrap">
              <p>
                Task:{" "}
                <span className="text-xs">
                  {taskDescription ?? "No task provided."}
                </span>
              </p>
            </article>
          </Badge>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            Shortcuts: Tab / Left / Right to move between screens
          </p>
          <div className="space-y-1 mt-3">
            <Switch
              checked={showBoxes}
              onCheckedChange={(checked) => {
                setShowBoxes(checked);
              }}
            />
            <span className="pl-3 text-xs font-medium">
              Show Bounding Boxes
            </span>
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
