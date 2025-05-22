import NextAuth, { Session, DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

import AppleProvider from "next-auth/providers/apple";
import GoogleProvider from "next-auth/providers/google";

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
  providers: [
    // AppleProvider({
    //   clientId: process.env.APPLE_CLIENT_ID,
    //   clientSecret: {
    //     appleId: process.env.APPLE_ID,
    //     privateKey: process.env.APPLE_PRIVATE_KEY,
    //     teamId: process.env.APPLE_TEAM_ID,
    //   },
    // }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
        // authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?prompt=consent&access_type=offline&response_type=code',
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-out",
  },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async session({ session, token }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
        if (dbUser) {
          session.user.role = dbUser.role ?? "USER";
          session.user.createdAt = dbUser.createdAt;
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Custom logic on sign in
      console.log("User signed in:", user);
    },
    async signOut(message) {
      // Custom logic on sign out
      if ("token" in message) {
        console.log("User signed out:", message.token);
      } else {
        console.log("User session signed out:", message.session);
      }
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to access this resource.");
  }
  return session;
}
