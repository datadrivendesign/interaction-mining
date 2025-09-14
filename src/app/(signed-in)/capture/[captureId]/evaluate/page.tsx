"use server";

import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getCapture } from "@/lib/actions";
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
  // Handle unauthenticated state
  if (!session || !session?.user) {
    redirect("/sign-in");
  }
  const isAdmin = session.user.role === Role.ADMIN;
  // check if captureId matches the user
  const capture = await getCapture({ id: captureId });
  const isOwner = capture.data?.userId === session.user.id;
  if ((!isOwner && !isAdmin) || !capture.data) {
    return <NotAuthorized />;
  }

  const platform = capture.data.app.os;
  if (platform === Platform.IOS) {
    return <EvaluationClientIOS isAdmin={isAdmin} />;
  } else {
    return <EvaluationClientAndroid isAdmin={isAdmin} />;
  }
}
