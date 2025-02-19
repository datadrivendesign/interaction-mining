import { getCapture, getIosAppById } from "@/lib/actions";
import type { Metadata, ResolvingMetadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ captureId: string }>;
}): Promise<Metadata> {
  const { captureId } = await params;
  let capture = await getCapture({ id: captureId });

  if (!capture) {
    throw new Error("Capture not found.");
  }

  let app = await getIosAppById({ appId: capture.appId });

  const metadata: Metadata = {
    title: "Upload Capture",
    other: {
      "apple-itunes-app": `app-id=${app.id}`,
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
