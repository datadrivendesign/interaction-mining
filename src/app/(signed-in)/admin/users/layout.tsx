import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { NotAuthorized } from "@/components/authorized";

/**
 * The users area lists every worker's name and email, so it stays ADMIN only
 * even though the parent admin layout now admits REVIEWERs.
 */
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!isAdmin(session)) {
    return <NotAuthorized />;
  }
  return <>{children}</>;
}
