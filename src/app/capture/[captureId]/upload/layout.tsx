import { getCapture, getIosApp } from "@/lib/actions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ captureId: string }>;
}): Promise<Metadata> {
  const { captureId } = await params;

  const { data: capture } = await getCapture({
    id: captureId,
    includes: { app: true, task: true },
  }).then((capture) => {
    if (!capture.ok) {
      notFound();
    } else {
      return capture;
    }
  });

  if (capture.task.os === "ios") {
    let app = await getIosApp({ appId: capture.appId });

    if (app.ok) {
      const metadata: Metadata = {
        title: "Upload Capture",
        other: {
          "apple-itunes-app": `app-id=${app.data.id}`,
        },
      };

      return metadata;
    }
  }

  const metadata: Metadata = {
    title: "Upload Capture",
  };

  return metadata;
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
