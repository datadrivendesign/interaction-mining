import { middleware } from "./lib/auth";

export default middleware((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/sign-in") {
    const loginUrl = new URL("/sign-in", req.nextUrl.origin);
    loginUrl.searchParams.set(
      "callbackUrl",
      req.nextUrl.pathname + req.nextUrl.search
    );
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/capture/:captureId/:path*"],
};
