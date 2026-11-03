import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Capture } from "@/lib/actions";

/**
 * Why a capture page refused to render. The edit, start, upload and evaluate
 * layouts each decide which reasons apply to them; the wording lives here so
 * all four say the same thing for the same state.
 */
export type GateReason =
  | "NO_CAPTURE"
  | "NOT_INITIATED"
  | "NOT_PROCESSED"
  | "IN_REVIEW"
  | "WAITING_FINAL"
  | "APPROVED"
  | "NO_FILES";

type GateMessage = {
  title: string;
  message: string;
  linkText: string;
  linkUrl: string;
};

function gateMessage(
  reason: GateReason,
  captureId: string,
  capture: Capture | null,
): GateMessage {
  switch (reason) {
    case "NO_CAPTURE":
      return {
        title: "Capture not found",
        message: "Failed to fetch capture. Please try again later.",
        linkText: "Return to upload",
        linkUrl: `/capture/${captureId}/upload`,
      };
    case "NOT_INITIATED":
      return {
        title: "Initiate the capture",
        message:
          "The capture you are looking for has not been initiated yet or uploaded files. Please upload files and initialize the capture.",
        linkText: "Return to upload",
        linkUrl: `/capture/${captureId}/upload`,
      };
    case "NOT_PROCESSED":
      return {
        title: "Capture not processed",
        message:
          "The capture has not been processed yet. Please finish processing the capture before evaluating.",
        linkText: "Return to processing",
        linkUrl: `/capture/${captureId}/edit`,
      };
    case "IN_REVIEW":
      return {
        title: "Capture in review",
        message:
          "This capture is currently in review. If this status looks wrong (for example, it was recently sent back), refresh this page and try again.",
        linkText: "Return to review",
        linkUrl: `/capture/${captureId}/evaluate`,
      };
    case "WAITING_FINAL":
      return {
        title: "Waiting for final check",
        message:
          "A reviewer has approved this capture. It is now waiting for the final check. You cannot change it until that check is done.",
        linkText: "Return to dashboard",
        linkUrl: `/dashboard`,
      };
    case "APPROVED":
      return {
        title: "Capture already approved",
        message:
          "This capture has already been approved. You can view the completed trace.",
        linkText: "View trace",
        linkUrl: `/app/${capture?.appId}/trace/${capture?.traceId}`,
      };
    case "NO_FILES":
      return {
        title: "Waiting for files...",
        message:
          "The capture you are looking for does not have any uploaded files. Please upload files to proceed.",
        linkText: "Return to upload",
        linkUrl: `/capture/${captureId}/upload`,
      };
  }
}

/**
 * The card a capture layout renders instead of its children when the capture
 * is in the wrong state for that page. `linkUrl` overrides the default link
 * for the rare layout whose "go back" target differs.
 */
export function CaptureGateError({
  captureId,
  capture,
  reason,
  linkUrl,
}: {
  captureId: string;
  capture: Capture | null;
  reason: GateReason;
  linkUrl?: string;
}) {
  const error = gateMessage(reason, captureId, capture);
  const href = linkUrl ?? error.linkUrl;

  return (
    <div className="flex min-h-[calc(100dvh-64px)] w-dvw items-start justify-center p-8 md:items-center md:p-16">
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>{error.title}</CardTitle>
          <CardDescription>{error.message}</CardDescription>
          <Link href={href}>
            <span className="inline-flex items-center underline">
              <ArrowLeft className="mr-1 inline-block h-4 w-4" />
              {error.linkText}
            </span>
          </Link>
        </CardHeader>
      </Card>
    </div>
  );
}
