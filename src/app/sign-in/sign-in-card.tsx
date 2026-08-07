"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react"; // use next-auth/react here
import { useSearchParams } from "next/navigation";

export default function SignInCard() {
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
    await signIn("google", { redirectTo: safeCallbackUrl });
  };

  const handleSignOut = async () => {
    await signOut({ redirectTo: "/" });
  };

  return (
    <div className="flex min-h-dvh w-dvw items-start justify-center p-8 md:items-center md:p-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-black">
            Sign in to ODIM
          </CardTitle>

          {/* Google */}
          <Button
            className="flex w-full grow items-center justify-center rounded-lg px-4 py-2"
            onClick={handleGoogleSignIn}
          >
            <span className="inline-flex items-center font-medium text-white dark:text-black">
              <Image
                className="mr-4 h-4 w-auto"
                src="/third-party-logos/g.webp"
                alt="Google logo"
                width={0}
                height={0}
                sizes="100vw"
              />
              Sign in with Google
            </span>
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
