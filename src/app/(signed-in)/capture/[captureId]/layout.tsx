import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCapture, getTraces, updateCapture } from "@/lib/actions";
import { AuthorizedRoute } from "@/components/authorized";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ captureId: string }>;
  children: React.ReactNode;
}) {
  const { captureId } = await params;
  let capture = await getCapture({ id: captureId });

  const traces = await getTraces({ captureId: captureId });

  // If capture is not found, redirect to 404
  if (!capture.ok) {
    notFound();
  } else {
    // If capture has a traceId, redirect to the trace page
    if (capture.data.traceId) {
      return (
        <TraceCreatedRedirect
          redirectTo={`trace/${capture.data.traceId}/edit`}
        />
      );
    }

    // If capture has no traceId and there are traces associated with the captureId, update the capture with the last traceId
    else if (traces.data && traces.data.length > 0) {
      const lastTrace = traces.data?.[traces.data.length - 1];
      await updateCapture(captureId, {
        traceId: lastTrace.id,
      });

      return <TraceCreatedRedirect redirectTo={`trace/${lastTrace.id}/edit`} />;
    }
  }

  return (
    <>
      <AuthorizedRoute resourceUserId={capture.data?.userId ?? undefined}>
        {children}
      </AuthorizedRoute>
    </>
  );
}

function TraceCreatedRedirect({ redirectTo }: { redirectTo: string }) {
  return (
    <div className="flex w-dvw h-[calc(100dvh-65px)] justify-center items-start md:items-center p-8 md:p-16">
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>Trace already exists</CardTitle>
          <CardDescription>
            You&rsquo;ve already created a trace for this capture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            className="inline-flex items-center underline"
            href={`/${redirectTo}`}
          >
            Go to trace editor {"->"}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
