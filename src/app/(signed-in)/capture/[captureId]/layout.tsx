import { notFound, redirect } from "next/navigation";

import { getCapture, getTrace, getTraces, updateCapture } from "@/lib/actions";

async function fixAndRedirect(captureId: string) {
  let capture = await getCapture({ id: captureId });
  const traces = await getTraces({ captureId: captureId });

  // If capture is not found, redirect to 404
  if (!capture.ok) {
    notFound();
  } else {
    // If capture has a traceId, redirect to the trace page
    if (capture.data.traceId) {
      redirect(`/trace/${capture.data.traceId}/edit`);
    }

    // If capture has no traceId and there are traces associated with the captureId, update the capture with the last traceId
    if (traces.data && traces.data.length > 0) {
      const lastTrace = traces.data?.[traces.data.length - 1];
      await updateCapture(captureId, {
        traceId: lastTrace.id,
      });

      redirect(`/trace/${lastTrace.id}/edit`);
    }
  }
}

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ captureId: string }>;
  children: React.ReactNode;
}) {
  const { captureId } = await params;

  await fixAndRedirect(captureId);

  return <>{children}</>;
}
