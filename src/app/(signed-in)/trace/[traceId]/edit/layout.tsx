import { notFound } from "next/navigation";
import { getTrace } from "@/lib/actions";
import { AuthorizedRoute } from "@/components/authorized";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ traceId: string }>;
  children: React.ReactNode;
}) {
  const { traceId } = await params;
  const trace = await getTrace(traceId).then((trace) => {
    if (!trace.ok) {
      notFound();
    }

    return trace;
  });

  // Check if the capture has any uploaded files
  const render = (
    <>
      <AuthorizedRoute resourceUserId={trace.data.userId}>
        {children}
      </AuthorizedRoute>
    </>
  );
  return render;
}
