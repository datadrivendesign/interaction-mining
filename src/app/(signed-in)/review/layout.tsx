import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isReviewer } from "@/lib/auth/roles";
import { NotAuthorized } from "@/components/authorized";

/** Review queue: REVIEWER and ADMIN. No worker names or emails here. */
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/review/tasks`);
  }
  if (!isReviewer(session)) {
    return <NotAuthorized />;
  }
  return <>{children}</>;
}
