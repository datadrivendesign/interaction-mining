import Image from "next/image";
import { App } from "@prisma/client";

import {
  GalleryRoot,
  GallerySearch,
  Gallery,
} from "@/app/explore/components/gallery";
import { getApps } from "@/lib/actions";
// import { prettyNumber } from "@/lib/utils/number";

// const prettyDownloadNumber = (downloads: string) => {
//   // strip "+" from downloads
//   downloads = downloads.replace("+", "");
//   downloads = downloads.replace(/,/g, "");
//   return `${prettyNumber(parseInt(downloads, 10))}`;
// };

export default async function Explore() {
  let apps: App[] = await getApps({
    limit: 50,
  });

  return (
    <GalleryRoot data={apps}>
      <main className="relative flex flex-col grow min-h-screen items-center justify-between">
        <section className="relative flex flex-col w-full max-w-screen-2xl px-16 py-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">
              Explore App Traces
            </h1>
            <GallerySearch />
          </div>
          <div className="w-full h-0.5 bg-neutral-100 rounded-full mb-8" />
          <Gallery/>
        </section>
      </main>
    </GalleryRoot>
  );
}
