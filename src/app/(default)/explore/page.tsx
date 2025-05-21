import { App } from "@prisma/client";
import { GalleryRoot, GallerySearch, Gallery } from "./components/gallery";
import { getApps } from "@/lib/actions";

export default async function Explore() {
  let apps: App[] = [];

  try {
    apps = await getApps();
  } catch (error) {
    console.error("Failed to fetch apps:", error);
  }

  if (!apps || apps.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-dvh">
        <h1>No apps available</h1>
      </div>
    );
  }

  return (
    <GalleryRoot data={apps}>
      <main className="relative flex flex-col grow min-h-dvh items-center justify-between">
        <section className="relative flex flex-col w-full max-w-(--breakpoint-2xl)">
          <div className="sticky top-16 z-40 flex flex-col md:flex-row mb-4 md:mb-8 p-4 md:px-16 items-start md:justify-between md:items-center bg-white dark:bg-black border-b-2 border-neutral-100 dark:border-neutral-900">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 md:mb-0">
              Explore App Traces
            </h1>
            <GallerySearch />
          </div>
          <Gallery />
        </section>
      </main>
    </GalleryRoot>
  );
}
