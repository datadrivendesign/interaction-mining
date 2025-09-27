import NextAuth, { Session, DefaultSession } from "next-auth";
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
  // Remove PrismaAdapter - use JWT strategy only
  // adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
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
        console.log("🔐 JWT CALLBACK - SIGN IN:", {
          timestamp: new Date().toISOString(),
          oauthUserId: user.id,
          oauthEmail: user.email,
          oauthName: user.name,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          sessionId: `${user.id}-${Date.now()}-${Math.random()}`,
        });

        token.accessToken = account.access_token;
        // Add unique session identifier to prevent cross-user sessions
        token.sessionId = `${user.id}-${Date.now()}-${Math.random()}`;
        // Fetch role from database only during sign-in
        try {
          const dbUser = await prisma.user.findFirst({
            where: {
              accounts: {
                some: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
            },
            select: { id: true, role: true, createdAt: true },
          });
          if (dbUser) {
            console.log("🔍 DATABASE USER FOUND:", {
              timestamp: new Date().toISOString(),
              dbUserId: dbUser.id,
              dbRole: dbUser.role,
              oauthUserId: user.id,
              sessionId: token.sessionId,
            });
            token.userId = dbUser.id; // Store the MongoDB ObjectId
            token.role = dbUser.role;
            token.createdAt = dbUser.createdAt;
          } else {
            console.log("❌ NO DATABASE USER FOUND:", {
              timestamp: new Date().toISOString(),
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              oauthUserId: user.id,
            });
          }
        } catch (error) {
          console.error("❌ DATABASE ERROR:", {
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error",
            oauthUserId: user.id,
          });
        }
      } else {
        console.log("🔄 JWT CALLBACK - TOKEN REFRESH:", {
          timestamp: new Date().toISOString(),
          tokenUserId: token.userId,
          tokenEmail: token.email,
          tokenName: token.name,
          tokenRole: token.role,
          tokenSessionId: token.sessionId,
        });
      }

      // if no role, set it to default user role
      if (!token.role) {
        token.role = user.role ?? Role.USER;
      }

      return token;
    },
    async session({ session, token }) {
      console.log("📋 SESSION CALLBACK:", {
        timestamp: new Date().toISOString(),
        sessionEmail: session.user?.email,
        sessionName: session.user?.name,
        tokenUserId: token.userId,
        tokenEmail: token.email,
        tokenName: token.name,
        tokenRole: token.role,
        tokenSessionId: token.sessionId,
      });

      // Send properties to the client
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.role = token.role as Role;
        if (token.createdAt) {
          session.user.createdAt = token.createdAt as Date;
        }
      }

      console.log("📋 SESSION RESULT:", {
        timestamp: new Date().toISOString(),
        finalEmail: session.user?.email,
        finalId: session.user?.id,
        finalRole: session.user?.role,
      });

      return session;
    },
    async authorized({ auth }) {
      return !!auth;
    },
  },
});

/**
 * Middleware for Auth.js - uses same config as main auth
 */
export const { auth: middleware } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
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
