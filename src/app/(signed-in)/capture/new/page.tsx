import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import CaptureNewClient from "./capture-new-client";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const session = await auth();
  const resolvedSearchParams = await searchParams;

  if (!session?.user?.id) {
    const callbackParams = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearchParams ?? {})) {
      if (typeof value === "string") {
        callbackParams.set(key, value);
      }
    }
    const callbackUrl = `/capture/new${
      callbackParams.size > 0 ? `?${callbackParams.toString()}` : ""
    }`;
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return <CaptureNewClient user={session.user} />;
}
