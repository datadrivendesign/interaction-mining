import NextAuth from "next-auth";
import authConfig from "./lib/auth/auth.config";

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
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.userId = user.id;
        token.role = user.role ?? "USER";
        token.sessionId = `${user.id}-${Date.now()}-${Math.random()}`;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        if (token.createdAt) {
          session.user.createdAt = token.createdAt as Date;
        }
      }
      return session;
    },
  },
});

export default middleware((req) => {
  // Skip auth check for OAuth callback routes
  if (req.nextUrl.pathname.startsWith("/api/auth/callback")) {
    return;
  }

  // Skip auth check for sign-in page
  if (req.nextUrl.pathname === "/sign-in") {
    return;
  }

  // Check if user is authenticated
  if (!req.auth) {
    const loginUrl = new URL("/sign-in", req.nextUrl.origin);
    loginUrl.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search
    );
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/capture/:captureId/:path*",
    "/dashboard",
    "/trace/:traceId/edit",
    "/admin/:path*",
  ],
};
