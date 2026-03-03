import NextAuth, { Session, DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import authConfig from "./auth.config";
import { Role } from "@prisma/client";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's role. */
      role: string;
      createdAt: Date;
    } & DefaultSession["user"];
  }
  interface User {
    role: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  ...authConfig,
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-out",
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      // Send properties to the client
      if (user.id) {
        session.user.id = user.id as string;
        session.user.role = (user.role as Role) ?? Role.USER;
      }

      return session;
    },
    async authorized({ auth }) {
      return !!auth;
    },
  },
});

/**
 * Verifies if a user is signed in and optionally checks a signed in user has certain roles
 * @returns session
 */
export async function requireAuth(): Promise<Session> {
  let session: Session | null;
  try {
    session = await auth();
  } catch (err) {
    // If parsing or auth fails, treat as unauthenticated
    session = null;
    throw new AuthenticationError();
  }
  if (!session?.user?.id) {
    throw new AuthenticationError();
  }
  return session;
}

class AuthenticationError extends Error {
  constructor(message = "You must be signed in to access this resource.") {
    super(message);
    this.name = "NotAuthenticatedError";
  }
}
