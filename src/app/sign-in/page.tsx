import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { signIn, signOut } from "@/lib/auth";

export default async function Page() {
  const handleGoogleSignIn = async () => {
    "use server";

    await signIn("google");
  };

  const handleSignOut = async () => {
    "use server";

    await signOut();
  };

  return (
    <div className="flex w-dvw min-h-dvh justify-center items-start md:items-center p-8 md:p-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-black">
            Sign in to ODIM
          </CardTitle>
          <Button className="flex grow justify-center items-center w-full rounded-lg px-4 py-2">
            <span
              className="inline-flex items-center text-white dark:text-black font-medium"
              onClick={handleGoogleSignIn}
            >
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
          <Button className="flex grow justify-center items-center w-full rounded-lg px-4 py-2"
            onClick={handleSignOut}
          >
            <span className="inline-flex items-center text-white dark:text-black font-medium">
                Sign out
            </span>
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
