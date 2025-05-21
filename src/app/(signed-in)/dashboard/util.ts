"use server";

import { auth } from "@/lib/auth";
import { toast } from "sonner";

export async function handleTest() {
  const session = await auth();

  if (!session?.user?.id) {
    toast.error("You must be signed in to save.");
    return;
  }

  console.log("Session: ", session);
}
