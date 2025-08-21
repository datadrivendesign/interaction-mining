import { Cake, CircleDot, Clock, CheckCircle } from "lucide-react";
import { User } from "@prisma/client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { googleImageAdapter } from "../../lib/image";
import { prettyTime } from "@/lib/utils";

export function ProfileCard({
  user,
  totalCaptures,
  approvedCaptures,
  pendingCaptures,
}: {
  user: User;
  totalCaptures: number;
  approvedCaptures: number;
  pendingCaptures: number;
}) {
  return (
    <Card className="flex flex-col w-80 p-6 h-fit">
      <aside>
        <Avatar className="w-full h-auto aspect-square mb-4">
          <AvatarImage
            src={googleImageAdapter(user?.image ?? "", 512)}
            alt="User avatar"
          />
          <AvatarFallback>
            <div className="w-full h-full bg-muted-background flex items-center justify-center">
              <span className="text-2xl font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col space-y-3">
          <div>
            <h1 className="text-xl font-semibold">{user?.name}</h1>
            <span className="text-muted-foreground text-sm">{user?.email}</span>
          </div>

          {/* Stats */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted-background rounded-lg">
              <div className="flex items-center">
                <CircleDot className="mr-2 size-4 text-blue-500" />
                <span className="text-sm">Total Captures</span>
              </div>
              <span className="font-semibold tabular-nums">
                {totalCaptures}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted-background rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="mr-2 size-4 text-green-500" />
                <span className="text-sm">Approved Traces</span>
              </div>
              <span className="font-semibold tabular-nums">
                {approvedCaptures}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted-background rounded-lg">
              <div className="flex items-center">
                <Clock className="mr-2 size-4 text-yellow-500" />
                <span className="text-sm">Pending Captures</span>
              </div>
              <span className="font-semibold tabular-nums">
                {pendingCaptures}
              </span>
            </div>
          </div>

          <span className="inline-flex items-center text-muted-foreground text-sm">
            <Cake className="mr-1 size-4" />
            Contributer since{" "}
            {prettyTime(new Date(user?.createdAt), {
              format: "yyyy",
            })}
          </span>
        </div>
      </aside>
    </Card>
  );
}
