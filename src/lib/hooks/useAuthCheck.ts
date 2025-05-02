import { getSessionData } from "@/lib/actions";
import { redirect } from "next/navigation";

export async function useAuthCheck(callbackUrl: string = "/") {
  const session = await getSessionData();
  if (!session) redirect(`${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/sign-in?callbackUrl=/admin`);
  return session;
}