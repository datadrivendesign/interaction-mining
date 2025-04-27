"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";

// This function retrieves the current session using the auth function
export async function getSession() {
    const session = await auth();
    return session;
  };

