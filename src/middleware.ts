import { middleware } from "./lib/auth";

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
