import { Cake, CircleDot, Clock, CheckCircle } from "lucide-react";
import { User } from "@prisma/client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { googleImageAdapter } from "../../lib/image";
import { prettyTime } from "@/lib/utils";
import { DevicePreferenceControl } from "./iphone-preference-control";

export function ProfileCard({
  user,
  createdCaptures,
  processingCaptures,
  reviewingCaptures,
}: {
  user: User;
  createdCaptures: number;
  processingCaptures: number;
  reviewingCaptures: number;
}) {
  return (
    <Card className="flex h-fit w-full flex-col p-4 sm:p-6 lg:w-64 lg:shrink-0">
      <aside>
        <Avatar className="mx-auto mb-4 size-24 sm:size-32 lg:size-28">
          <AvatarImage
            src={googleImageAdapter(user?.image ?? "", 512)}
            alt="User avatar"
          />
          <AvatarFallback>
            <div className="flex h-full w-full items-center justify-center bg-muted-background">
              <span className="text-2xl font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col space-y-3">
          <div>
            <h1 className="text-xl font-semibold break-words">{user?.name}</h1>
            <span className="block text-sm break-all text-muted-foreground">
              {user?.email}
            </span>
          </div>

          {/* Stats */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted-background p-3">
              <div className="flex min-w-0 items-center">
                <CircleDot className="mr-2 size-4 shrink-0 text-blue-500" />
                <span className="min-w-0 text-sm">New Created Captures</span>
              </div>
              <span className="shrink-0 font-semibold tabular-nums">
                {createdCaptures}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted-background p-3">
              <div className="flex min-w-0 items-center">
                <CheckCircle className="mr-2 size-4 shrink-0 text-green-500" />
                <span className="min-w-0 text-sm">Captures in Processing</span>
              </div>
              <span className="shrink-0 font-semibold tabular-nums">
                {processingCaptures}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted-background p-3">
              <div className="flex min-w-0 items-center">
                <Clock className="mr-2 size-4 shrink-0 text-yellow-500" />
                <span className="min-w-0 text-sm">Captures in Review</span>
              </div>
              <span className="shrink-0 font-semibold tabular-nums">
                {reviewingCaptures}
              </span>
            </div>
          </div>

          <span className="inline-flex items-center text-sm text-muted-foreground">
            <Cake className="mr-1 size-4 shrink-0" />
            Contributer since{" "}
            {prettyTime(new Date(user?.createdAt), {
              format: "yyyy",
            })}
          </span>
          <DevicePreferenceControl />
        </div>
      </aside>
    </Card>
  );
}
