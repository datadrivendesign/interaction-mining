import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCaptureFiles } from "@/lib/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ captureId: string }>;
  children: React.ReactNode;
}) {
  const { captureId } = await params;

  // Check if the capture has any uploaded files
  const render = await getCaptureFiles(captureId).then((res) => {
    if (!res.ok) {
      notFound();
    }

    if (res.data.length === 0) {
      return (
        <>
          <Error captureId={captureId} />
        </>
      );
    } else {
      return <>{children}</>;
    }
  });

  return render;
}

function Error({ captureId }: { captureId: string }) {
  return (
    <div className="flex w-dvw min-h-[calc(100dvh-64px)] justify-center items-start md:items-center p-8 md:p-16">
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>Waiting for files...</CardTitle>
          <CardDescription>
            The capture you are looking for does not have any uploaded files.
            Please upload files to proceed.
          </CardDescription>
          <Link href={`/capture/${captureId}/start`}>
            <span className="inline-flex items-center underline">
              <ArrowLeft className="w-4 h-4 mr-1 inline-block" />
              Return to upload
            </span>
          </Link>
        </CardHeader>
      </Card>
    </div>
  );
}
