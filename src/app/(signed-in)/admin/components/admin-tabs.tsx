"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewPending } from "./review-pending";
import { UserManager } from "./user-manager";
import { ManageableUser } from "./types";
import { CaptureAdminView } from "@/lib/actions";

interface AdminTabsProps {
  users: ManageableUser[];
  captures: CaptureAdminView[];
}

export function AdminTabs({ users, captures }: AdminTabsProps) {
  return (
    <Tabs defaultValue="pending-review">
      <TabsList>
        <TabsTrigger value="pending-review">Check Pending Reviews</TabsTrigger>
        <TabsTrigger value="user-management">Manage Users</TabsTrigger>
      </TabsList>
      <TabsContent value="pending-review">
        <ReviewPending captures={captures} />
      </TabsContent>
      <TabsContent value="user-management">
        <UserManager users={users} />
      </TabsContent>
    </Tabs>
  );
}
