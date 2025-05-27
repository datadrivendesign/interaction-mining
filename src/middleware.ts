import { auth } from "./lib/auth";

export default auth((req) => {
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
  runtime: "nodejs",
  matcher: ["/capture/:captureId/:path*"],
};
