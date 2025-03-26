import { getCapture, getIosApp } from "@/lib/actions";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ captureId: string }>;
}): Promise<Metadata> {
  const { captureId } = await params;

  const { data: capture } = await getCapture({ id: captureId }).then(
    (capture) => {
      if (!capture.ok) {
        notFound();
      } else {
        return capture;
      }
    }
  );

  let app = await getIosApp({ appId: capture.appId });

  console.log(app);

  const metadata: Metadata = {
    title: "Upload Capture",
    other: {
      "apple-itunes-app": `app-id=${app.data.id}`,
    },
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
