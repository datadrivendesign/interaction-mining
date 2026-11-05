import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isAdmin, isReviewer } from "@/lib/auth/roles";
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
  // ADMIN only. Reviewers have their own queue at /review/tasks; send old
  // bookmarks there instead of showing an error.
  if (!isAdmin(session)) {
    if (isReviewer(session)) {
      redirect("/review/tasks");
    }
    return <NotAuthorized />;
  }

  return <>{children}</>;
}
