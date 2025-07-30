import { Role } from "@prisma/client";

export type ManageableUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
}