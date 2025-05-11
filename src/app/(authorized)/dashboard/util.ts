"use server";

import { auth } from "@/lib/auth";

export async function handleTest() {
  const session = await auth();
  console.log("Session: ", session);
}
