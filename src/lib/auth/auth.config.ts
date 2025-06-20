import { NextAuthConfig } from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import GoogleProvider from "next-auth/providers/google";

// Notice this is only an object, not a full Auth.js instance
export default {
  secret: process.env.NEXTAUTH_SECRET,
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
      },
    }),
  ],
} satisfies NextAuthConfig;
