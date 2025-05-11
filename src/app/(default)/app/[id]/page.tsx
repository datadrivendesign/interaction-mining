import Image from "next/image";
import { notFound } from "next/navigation";

import { getApp, getTraces } from "@/lib/actions";
import { GalleryRoot, Gallery } from "./components/gallery";

export default async function AppPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ trace: string }>;
}) {
  let app;
  let traces;

  try {
    var { id } = await params;
    var { trace: traceId } = await searchParams;
    app = await getApp(id);
    await getTraces({ appId: id, includes: { screens: true } }).then((res) => {
      if (res.ok) {
        traces = res.data;
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
      <main className="relative flex flex-col grow items-center justify-between">
        <section className="relative flex flex-col grow w-full">
          <div className="flex w-full max-w-screen-2xl self-center items-center mb-4 px-4">
            <Image
              src={app.metadata.icon}
              alt={`${app?.metadata.name} icon`}
              width={48}
              height={48}
              className="rounded-xl drop-shadow-md mr-4"
            />
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-normal truncate">
              {app?.metadata.name}
            </h1>
          </div>
          <div className="w-full h-0.5 bg-neutral-100 dark:bg-neutral-900 rounded-full mb-0 lg:mb-4" />
          <Gallery traceId={traceId || ""} />
        </section>
      </main>
    </GalleryRoot>
  );
}
