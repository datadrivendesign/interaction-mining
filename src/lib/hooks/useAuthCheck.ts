import { getSessionData } from "@/lib/actions";
import { redirect } from "next/navigation";

export async function useAuthCheck(callbackUrl: string = "/dashboard") {
  const session = await getSessionData();
  if (!session) redirect(`/sign-in?callbackUrl=${callbackUrl} ?? /dashboard`);
  return session;
}
