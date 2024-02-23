import Image from "next/image";
import { notFound } from "next/navigation";

import { getApp, getTraceByApp } from "@/lib/actions";

export default async function AppPage({ params }: { params: any }) {
  let app;
  let traces;

  try {
    app = await getApp(params.id);
    traces = await getTraceByApp(params.id);

    if (!app) {
      notFound();
    }
  } catch {
    notFound();
  }

  return (
    <main className="relative flex flex-col grow min-h-screen items-center justify-between">
      <section className="relative flex flex-col w-full max-w-screen-2xl px-16 py-8">
        <div className="flex items-center mb-4">
          <Image
            src={app.icon}
            alt={`${app?.name} icon`}
            width={48}
            height={48}
            className="rounded-xl drop-shadow-md mr-4"
          />
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
            {app?.name}
          </h1>
        </div>
        <div className="w-full h-0.5 bg-neutral-100 rounded-full mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {traces.map((trace, index) => (
            <>
              <div key={index} className="flex flex-col">
                <h2 className="text-lg font-bold tracking-tight mb-2">
                  {trace?.created.toString()}
                </h2>
                <p className="text-sm text-neutral-500">{trace?.description}</p>
              </div>
            </>
          ))}
        </div>
      </section>
    </main>
  );
}
