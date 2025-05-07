import { notFound } from "next/navigation";
import { getTrace, getUploadedCaptureFiles } from "@/lib/actions";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ traceId: string }>;
  children: React.ReactNode;
}) {
  const { traceId } = await params;
  console.log("Trace ID", traceId);
  await getTrace(traceId).then((capture) => {
    console.log("Capture", capture);
    if (!capture.ok) {
      notFound();
    }
  });

  // Check if the capture has any uploaded files
  const render = await getUploadedCaptureFiles(traceId).then((res) => {
    if (res.ok) {
      return <>{children}</>;
    } else {
      notFound();
    }
  });

  return render;
}
