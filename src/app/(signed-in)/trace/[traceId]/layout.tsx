import { notFound } from "next/navigation";
import { getTrace } from "@/lib/actions";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ traceId: string }>;
  children: React.ReactNode;
}) {
  const { traceId } = await params;
  await getTrace(traceId).then((trace) => {
    if (!trace.ok) {
      notFound();
    }
  });

  // Check if the capture has any uploaded files
  const render = <>{children}</>;
  return render;
}
