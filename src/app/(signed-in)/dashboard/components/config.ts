import { Clock, Play, Eye, CheckCircle } from "lucide-react";
import { CaptureStatus } from "@prisma/client";

export const statusConfig = {
  [CaptureStatus.CREATED]: {
    label: "Created",
    icon: Clock,
    color: "bg-blue-500",
    textColor: "text-blue-500",
    description: "Upload your recording to start",
  },
  [CaptureStatus.PROCESSING]: {
    label: "Processing",
    icon: Play,
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    description: "Needs to be processed",
  },
  [CaptureStatus.REVIEWING]: {
    label: "Reviewing",
    icon: Eye,
    color: "bg-purple-500",
    textColor: "text-purple-500",
    description: "Currently in review",
  },
  [CaptureStatus.REVIEWED]: {
    label: "Final check",
    icon: Eye,
    color: "bg-purple-500",
    textColor: "text-purple-500",
    description: "Waiting for final check",
  },
  [CaptureStatus.APPROVED]: {
    label: "Approved",
    icon: CheckCircle,
    color: "bg-green-500",
    textColor: "text-green-500",
    description: "Completed and approved",
  },
};

/**
 * Statuses each column lists. A reviewer's approval moves a capture to
 * REVIEWED; the worker still sees it under In review until the final check.
 */
export const COLUMN_QUERY_STATUSES: Record<
  "CREATED" | "PROCESSING" | "REVIEWING",
  CaptureStatus[]
> = {
  [CaptureStatus.CREATED]: [CaptureStatus.CREATED],
  [CaptureStatus.PROCESSING]: [CaptureStatus.PROCESSING],
  [CaptureStatus.REVIEWING]: [CaptureStatus.REVIEWING, CaptureStatus.REVIEWED],
};
