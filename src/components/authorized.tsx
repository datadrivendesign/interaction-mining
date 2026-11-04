import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { CaptureStatus, Role } from "@prisma/client";
import { isAdmin } from "@/lib/auth/roles";
import { reviewerMayOpen } from "@/lib/actions/capture-internal";

/**
 * Gates a capture page: the owner, an ADMIN, or a REVIEWER while the capture is
 * in a reviewable status (`captureStatus` must be passed for that rule to
 * apply). Unknown roles are rejected before the owner check, so every role in
 * the enum must be listed in the default below.
 */
export async function AuthorizedRoute({
  children,
  allowedRoles,
  callbackUrl,
  resourceUserId,
  captureStatus,
}: {
  children: Readonly<React.ReactNode>;
  allowedRoles?: string[];
  callbackUrl?: string;
  resourceUserId?: string;
  captureStatus?: CaptureStatus;
}) {
  const ownershipEnforcedRoles = new Set(
    allowedRoles ?? [Role.USER, Role.REVIEWER, Role.ADMIN],
  );
  let session = await auth();

  if (!session?.user) {
    // If not authenticated, redirect to sign-in page
    redirect(`/sign-in?callbackUrl=${callbackUrl ?? "/dashboard"}`);
  }

  if (!ownershipEnforcedRoles.has(session!.user.role)) {
    return <NotAuthorized />;
  }

  const isOwner = resourceUserId! && session.user.id === resourceUserId;
  const reviewerAllowed =
    captureStatus !== undefined && reviewerMayOpen(session, captureStatus);
  if (isOwner || isAdmin(session) || reviewerAllowed) {
    return <>{children}</>;
  }
  return <NotAuthorized />;
}

export async function NotAuthorized() {
  return (
    <div className="flex h-[calc(100dvh-65px)] w-dvw items-start justify-center p-8 md:items-center md:p-16">
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
