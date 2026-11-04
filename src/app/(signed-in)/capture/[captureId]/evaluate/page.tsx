"use server";

import { redirect } from "next/navigation";
import { CaptureStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/roles";
import { getCapture } from "@/lib/actions";
import { reviewerMayOpen } from "@/lib/actions/capture-internal";
import { NotAuthorized } from "@/components/authorized";
import { Platform } from "@/lib/utils";
import { EvaluationClientIOS } from "./components/ios/evaluation-client-ios";
import { EvaluationClientAndroid } from "./components/android/evaluation-client-android";

export default async function Page({
  params,
}: {
  params: Promise<{ captureId: string }>;
}) {
  const { captureId } = await params;
  // auth check
  const session = await auth();
  // Handle unauthenticated state (may already be handled by the layout though)
  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/capture/${captureId}/evaluate`);
  }
  const admin = isAdmin(session);
  // owner, admin, or a reviewer while the capture is in review
  const capture = await getCapture({ id: captureId, includes: { app: true } });
  if (!capture.data) {
    return <NotAuthorized />;
  }
  const isOwner = capture.data.userId === session.user.id;
  const reviewerAllowed = reviewerMayOpen(session, capture.data.status);
  if (!isOwner && !admin && !reviewerAllowed) {
    return <NotAuthorized />;
  }

  const terminalStatuses: CaptureStatus[] = [
    CaptureStatus.APPROVED,
    CaptureStatus.ARCHIVED,
  ];
  if (terminalStatuses.includes(capture.data.status)) {
    redirect(`/capture/${captureId}/start`);
  }

  const platform = capture.data.app.os;
  if (platform === Platform.IOS) {
    return <EvaluationClientIOS isAdmin={admin} />;
  } else {
    return <EvaluationClientAndroid isAdmin={admin} />;
  }
}
