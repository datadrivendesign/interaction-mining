import Image from "next/image";
import { notFound } from "next/navigation";

import { getApp, getTraces } from "@/lib/actions";
import { GalleryRoot, Gallery } from "./components/gallery";
import { prettyOS } from "@/lib/utils";
import { Screen } from "@prisma/client";

export default async function AppPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  let app;
  let traces;

  try {
    let { slug } = await params;
    let id = slug[0];

    app = await getApp(id);
    await getTraces({ appId: id, includes: { screens: true } }).then((res) => {
      if (res.ok) {
        traces = res.data;
        // sort screens for each trace by last ObjectId counter bytes
        traces?.forEach((trace: any) => {
          trace.screens?.sort((a: Screen, b: Screen) => {
            const hexNumA = parseInt(a.id.slice(-6), 16);
            const hexNumB = parseInt(b.id.slice(-6), 16);
            return hexNumA - hexNumB;
          });
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
      <main className="relative flex flex-col w-full max-w-dvw h-[calc(100dvh-65px)] items-center justify-start overflow-hidden">
        <div className="flex w-full max-w-screen-2xl items-center p-4">
          <Image
            src={app.metadata.icon}
            alt={`${app?.metadata.name} icon`}
            width={0}
            height={0}
            sizes="2.5rem"
            className="size-10 rounded-lg shadow mr-2"
          />
          <h1 className="text-2xl font-extrabold tracking-tight leading-normal truncate">
            {app?.metadata.name} {`(${prettyOS(app.os)})`}
          </h1>
        </div>
        <div className="w-full border-b border-muted-background" />
        <Gallery />
      </main>
    </GalleryRoot>
  );
}
