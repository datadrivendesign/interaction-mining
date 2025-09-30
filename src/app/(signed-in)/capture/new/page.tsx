import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import CaptureNewClient from "./capture-new-client";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/capture/new");
  }

  return <CaptureNewClient user={session.user} />;
}
