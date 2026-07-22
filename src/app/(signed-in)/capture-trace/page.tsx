import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import CaptureTraceClient from "./capture-trace-client";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=/capture-trace");
  }

  return <CaptureTraceClient />;
}
