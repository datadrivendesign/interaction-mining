"use server";

import { auth } from "@/lib/auth";

// This function retrieves the current session using the auth function
export async function getSessionData() {
    const session = await auth();
    return session;
  };

