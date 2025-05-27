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

  if (capture.task.os === "ios" && capture.app?.packageName) {
    try {
      let app = await getIosApp({ appId: capture.app.packageName });

      if (app.ok) {
        const metadata: Metadata = {
          title: "Upload Capture",
          other: {
            "apple-itunes-app": `app-id=${app.data.id}`,
          },
        };

        return metadata;
      }
    } catch (error) {
      console.error("Failed to fetch iOS app data:", error);
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
