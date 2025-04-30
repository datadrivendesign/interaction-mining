"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react"; // use next-auth/react here
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  
  // Enhanced callback URL validation
  const safeCallbackUrl = (() => {
    if (!callbackUrl) return "/dashboard";
    // Only allow relative URLs or URLs from our domain
    if (callbackUrl.startsWith("/")) return callbackUrl;
    try {
      const url = new URL(callbackUrl);
      if (url.hostname === window.location.hostname) return callbackUrl;
    } catch (e) {
      // Invalid URL
    }
    return "/dashboard";
  })();

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: safeCallbackUrl });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex w-dvw min-h-dvh justify-center items-start md:items-center p-8 md:p-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-black">
            Sign in to ODIM
          </CardTitle>

          {/* Google */}
          <Button
            className="flex grow justify-center items-center w-full rounded-lg px-4 py-2"
            onClick={handleGoogleSignIn}
          >
            <span className="inline-flex items-center text-white dark:text-black font-medium">
              <Image
                className="w-auto h-4 mr-4"
                src="/third-party-logos/g.webp"
                alt="Google logo"
                width={0}
                height={0}
                sizes="100vw"
              />
              Sign in with Google
            </span>
          </Button>

          {/* Apple (disabled for now) */}
          <Button
            className="flex grow justify-center items-center w-full rounded-lg px-4 py-2"
            disabled
          >
            <span className="inline-flex items-center text-white dark:text-black font-medium">
              <Image
                className="w-auto h-4 mr-4 invert dark:invert-0"
                src="/third-party-logos/apple.svg"
                alt="Apple logo"
                width={0}
                height={0}
                sizes="100vw"
              />
              Sign in with Apple
            </span>
          </Button>

          {/* Sign Out */}
          {/* <Button
            className="flex grow justify-center items-center w-full rounded-lg px-4 py-2"
            onClick={handleSignOut}
          >
            <span className="inline-flex items-center text-white dark:text-black font-medium">
              Sign out
            </span>
          </Button> */}
        </CardHeader>
      </Card>
    </div>
  );
}
