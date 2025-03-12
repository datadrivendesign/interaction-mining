import { notFound } from "next/navigation";

import { getCapture } from "@/lib/actions";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ captureId: string }>;
  children: React.ReactNode;
}) {
  const { captureId } = await params;

  await getCapture({ id: captureId }).then((capture) => {
    if (!capture.ok) {
      notFound();
    } else {
      return capture;
    }
  });

  return <>{children}</>;
}
