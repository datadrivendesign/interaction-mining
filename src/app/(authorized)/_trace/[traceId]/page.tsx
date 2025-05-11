import { notFound } from "next/navigation";

import { getTrace } from "@/lib/actions";

export default async function Page({
  params,
}: {
  params: Promise<{ traceId: string }>;
}) {
  let trace;

  try {
    const { traceId } = await params;
    await getTrace(traceId).then((res) => {
      if (res.ok) {
        trace = res.data;
      }
    });

  } catch {
    notFound();
  }

  return (
    <>{trace!.id}</>
  );
}
