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
        "right-4 absolute top-0 w-60 h-40 p-0 z-10 shadow-md bg-background border rounded-md"
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
          <p className="mt-1 text-xs font-semibold">
            1. Capture screens from video.
          </p>
          <p className="text-xs font-semibold">2. Add gestures to screens</p>
          <p className="text-xs">
            <strong>Add screen gestures on this side.</strong> Fill in the
            template fields for each gesture. Use <strong>Other</strong> when
            you need freeform text.
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
        "right-4 absolute top-0 w-60 h-40 p-0 z-10 shadow-md bg-background border rounded-md h-fit"
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
          <p className="mt-2 text-xs font-semibold">Add gestures to screens</p>
          <p className="mt-2 text-xs">
            <strong>Add screen gestures on this side.</strong> Fill in the
            template fields for each gesture. Use <strong>Other</strong> when
            you need freeform text.
          </p>
          <div className="space-y-1 my-5">
            <Switch
              checked={showBoxes}
              onCheckedChange={(checked) => {
                setShowBoxes(checked);
              }}
            />
            <span className="pl-3">Show Bounding Boxes</span>
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
