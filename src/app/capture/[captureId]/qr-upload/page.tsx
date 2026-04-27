import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";

export default async function Page({
  params,
}: {
  params: Promise<{ captureId: string }>;
}) {
  const { captureId } = await params;
  const session = await auth();
  const uploadPath = `/capture/${captureId}/upload`;
  const qrCallbackPath = `/capture/${captureId}/qr-upload`;

  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(qrCallbackPath)}`);
  }

  redirect(uploadPath);
}
