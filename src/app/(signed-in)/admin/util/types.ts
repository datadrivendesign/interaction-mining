import { Prisma, ReviewStage, Role } from "@prisma/client";

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

export const REVIEWING_CAPTURE_ORDER_BY = {
  id: "desc",
} satisfies Prisma.CaptureOrderByWithRelationInput;

/**
 * Review queues: REVIEWING (reviewers and admins), REVIEWED (final check) and
 * SENT_BACK (PROCESSING with a rejection, waiting on the worker), admin only.
 */
export const TASK_STAGES = ["REVIEWING", "REVIEWED", "SENT_BACK"] as const;
export type TaskStage = (typeof TASK_STAGES)[number];

/** Review-log facts shown on a queue row. */
export type TaskReviewInfo = {
  /** This submission's attempt: times sent back + 1. */
  attempt: number;
  timesSentBack: number;
  /** Reviewer behind the stage's key row; null for reviewers (admin only). */
  lastBy: string | null;
  lastStage: ReviewStage | null;
  selfReviewed: boolean;
};

export type TaskRow = CaptureAdminView & {
  review: TaskReviewInfo;
  /** The viewer recorded this capture. */
  isOwn: boolean;
};
