"use server";

import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import EvaluationClient from "./evaluation-client";
import { auth } from "@/lib/auth";
import { getCapture } from "@/lib/actions";
import { NotAuthorized } from "@/components/authorized";

export default async function Page({
  params,
}: {
  params: { captureId: string };
}) {
  const session = await auth();
  // Handle unauthenticated state
  if (!session || !session?.user) {
    redirect("/sign-in");
  }

  const isAdmin = session.user.role === Role.ADMIN;
  // check if captureId matches the user
  const capture = await getCapture({ id: params.captureId });
  const isOwner = capture.data?.userId === session.user.id;

  if (!isOwner && !isAdmin) {
    return <NotAuthorized />;
  }

  return <EvaluationClient isAdmin={isAdmin} />;
}
