import Image from "next/image";
import { notFound } from "next/navigation";

import { getApp, getTraces, Trace } from "@/lib/actions";
import { GalleryRoot, Gallery } from "./components/gallery";
import { prettyOS } from "@/lib/utils";
import { App } from "@prisma/client";
import { compareScreensChronological } from "./lib";

export default async function AppPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  let app: App | null;
  let traces: Trace[] = [];

  try {
    let { slug } = await params;
    let id = slug[0];

    app = await getApp(id);
    await getTraces({ appId: id, includes: { screens: true } }).then((res) => {
      if (res.ok) {
        traces = res.data;
        traces?.forEach((trace) => {
          trace.screens?.sort(compareScreensChronological);
        });
      }
    });

    if (!app) {
      notFound();
    }
  } catch {
    notFound();
  }

  return (
    <GalleryRoot data={traces}>
      <main className="relative flex h-[calc(100dvh-65px)] w-full max-w-dvw flex-col items-center justify-start overflow-hidden">
        <div className="flex w-full max-w-screen-2xl items-center p-4">
          <Image
            src={app.metadata.icon}
            alt={`${app?.metadata.name} icon`}
            width={0}
            height={0}
            sizes="2.5rem"
            className="mr-2 size-10 rounded-lg shadow"
          />
          <h1 className="truncate text-2xl leading-normal font-extrabold tracking-tight">
            {app?.metadata.name} {`(${prettyOS(app.os)})`}
          </h1>
        </div>
        <div className="w-full border-b border-muted-background" />
        <Gallery />
      </main>
    </GalleryRoot>
  );
}
