import NextAuth, { Session, DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
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
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  ...authConfig,
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-out",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account && user) {
        token.accessToken = account.access_token;
        token.userId = user.id;
        token.role = user.role ?? Role.USER;
        // Add unique session identifier to prevent cross-user sessions
        token.sessionId = `${user.id}-${Date.now()}-${Math.random()}`;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
        if (token.createdAt) {
          session.user.createdAt = token.createdAt as Date;
        }
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
