import { notFound } from "next/navigation";

import { getTrace } from "@/lib/actions";

export default async function AppPage({
  params,
}: {
  params: Promise<{ traceId: string }>;
}) {
  let trace;

  try {
    const { traceId } = await params;
    await getTrace(traceId).then((res) => {
      if (res.ok) {
        trace = res.data;
      }
    });

  } catch {
    notFound();
  }

  return (
    <>{trace!.id}</>
    // <GalleryRoot data={traces}>
    //   <main className="relative flex flex-col grow items-center justify-between">
    //     <section className="relative flex flex-col grow w-full">
    //       <div className="flex w-full max-w-(--breakpoint-2xl) self-center items-center mb-4 px-4 md:px-16">
    //         <Image
    //           src={app.metadata.icon}
    //           alt={`${app?.metadata.name} icon`}
    //           width={48}
    //           height={48}
    //           className="rounded-xl drop-shadow-md mr-4"
    //         />
    //         <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
    //           {app?.metadata.name}
    //         </h1>
    //       </div>
    //       <div className="w-full h-0.5 bg-neutral-100 dark:bg-neutral-900 rounded-full mb-0 md:mb-4" />
    //       {/* <Gallery traceId="" /> */}
    //     </section>
    //   </main>
    // </GalleryRoot>
  );
}
