import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

export const InstructionCardIOS = ({ capture }: { capture: any }) => {
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
                  {capture?.task?.description ?? "No task provided."}
                </span>
              </p>
            </article>
          </Badge>
          <p className="mt-1 text-xs font-semibold">
            1. Capture screens from video.
          </p>
          <p className="text-xs font-semibold">2. Add gestures to screens</p>
          <p className="text-xs">
            <strong>Add screen gestures on this side.</strong> Start gesture
            description with a verb, no full sentences.
          </p>
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export const InstructionCardAndroid = ({ capture }: { capture: any }) => {
  return (
    <Card
      key="task"
      className="absolute top-4 left-4 w-56 h-32 p-3 z-10 shadow-md bg-background border rounded-md"
    >
      <CardHeader className="flex flex-col items-center p-2">
        <Badge>
          <article className="prose prose-neutral dark:prose-invert leading-snug text-xs font-semibold text-white dark:text-neutral-900 w-full whitespace-pre-wrap">
            <p>Task: {capture?.task?.description ?? "No task provided."}</p>
          </article>
        </Badge>
      </CardHeader>
    </Card>
  );
};
