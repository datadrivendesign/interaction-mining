import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export async function AuthorizedRoute({
  children,
  allowedRoles,
  callbackUrl,
  resourceUserId,
}: {
  children: Readonly<React.ReactNode>;
  allowedRoles?: string[];
  callbackUrl?: string;
  resourceUserId?: string;
}) {
  const ownershipEnforcedRoles = new Set(allowedRoles ?? ["USER", "ADMIN"]);
  let session;
  try {
    session = await requireAuth();
  } catch (err) {
    session = null;
  }

  if (!session || !session.user) {
    // If not authenticated, redirect to sign-in page
    redirect(`/sign-in?callbackUrl=${callbackUrl ?? "/dashboard"}`);
  }

  if (!ownershipEnforcedRoles.has(session!.user.role)) {
    return <NotAuthorized />;
  }

  if (resourceUserId! && session.user.id === resourceUserId) {
    return <>{children}</>;
  }

  return <NotAuthorized />;
}

export async function NotAuthorized() {
  return (
    <div className="flex w-dvw h-[calc(100dvh-65px)] justify-center items-start md:items-center p-8 md:p-16">
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>Authorization Error</CardTitle>
          <CardDescription>
            You are not authorized to view this page. Please make sure your
            account has the required permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            className="inline-flex items-center underline"
            href="/dashboard"
          >
            {"<-"} Return to your dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
