import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

import AppleProvider from "next-auth/providers/apple";
import GoogleProvider from "next-auth/providers/google";

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
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async session({ session, token, }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
        if (dbUser) {
          session.user.role = dbUser.role ?? "USER";
        }
      }
      return session;
    },
  },
  events: {
    async signIn({user}) {
      // Custom logic on sign in
      console.log("User signed in:", user);
    },
    async signOut({}) {
      // Custom logic on sign out
      console.log("User signed out:");
    },
  },  
});