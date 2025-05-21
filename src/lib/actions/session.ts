"use server";

import { Session } from "next-auth";
import { auth } from "@/lib/auth";

// This function retrieves the current session using the auth function
export async function getSessionData(): Promise<Session | null> {
    const session = await auth();
    return session;
  };

