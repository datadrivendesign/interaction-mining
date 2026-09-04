import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCrawlTrace } from "@/lib/actions/crawl-request";
import { NotAuthorized } from "@/components/authorized";
import { CrawlTraceViewer } from "./components/crawl-trace-viewer";

export default async function Page({
  params,
}: {
  params: Promise<{ crawlRequestId: string }>;
}) {
  const { crawlRequestId } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/crawl-requests/${crawlRequestId}`);
  }

  const result = await getCrawlTrace(crawlRequestId);

  if (!result.ok || !result.data) {
    if (result.message === "Unauthorized.") {
      return <NotAuthorized />;
    }
    notFound();
  }

  const { crawlRequest, trace } = result.data;

  return <CrawlTraceViewer crawlRequest={crawlRequest} trace={trace} />;
}
