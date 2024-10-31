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
        <section className="relative flex flex-col w-full max-w-screen-2xl">
          <div className="sticky top-16 z-40 flex flex-col md:flex-row mb-4 md:mb-8 p-4 md:px-16 items-start md:justify-between md:items-center bg-white border-b-2 border-neutral-100">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 md:mb-0">
              Explore App Traces
            </h1>
            <GallerySearch />
          </div>
          <Gallery/>
        </section>
      </main>
    </GalleryRoot>
  );
}
