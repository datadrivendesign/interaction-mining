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
  [CaptureStatus.APPROVED]: {
    label: "Approved",
    icon: CheckCircle,
    color: "bg-green-500",
    textColor: "text-green-500",
    description: "Completed and approved",
  },
};
