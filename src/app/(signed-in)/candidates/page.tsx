import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { CandidatesClient } from "./candidates-client";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/candidates");
  }

  return <CandidatesClient />;
}
