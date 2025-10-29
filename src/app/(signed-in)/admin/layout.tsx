import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Role } from "@prisma/client";
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
  if (session!.user!.role !== Role.ADMIN) {
    return <NotAuthorized />;
  }

  return <>{children}</>;
}
