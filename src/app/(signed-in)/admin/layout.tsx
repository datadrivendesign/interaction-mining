import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isReviewer } from "@/lib/auth/roles";
import { NotAuthorized } from "@/components/authorized";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/`);
  }
  // REVIEWER and ADMIN share the review queue; admin/users has its own
  // ADMIN-only layout because it exposes worker names and emails.
  if (!isReviewer(session)) {
    return <NotAuthorized />;
  }

  return <>{children}</>;
}
