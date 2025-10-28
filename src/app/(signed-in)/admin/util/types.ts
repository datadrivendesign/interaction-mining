import { Prisma, Role } from "@prisma/client";

export type ManageableUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
};

export type CaptureAdminView = Prisma.CaptureGetPayload<{
  include: {
    app: true;
    task: true;
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;
