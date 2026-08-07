import { Suspense } from "react";
import { GalleryRoot, GallerySearch, Gallery } from "./components/gallery";
import { Loader2 } from "lucide-react";

export default async function Explore() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <GalleryRoot>
        <main className="relative flex grow flex-col items-center">
          <section className="relative flex w-full max-w-(--breakpoint-2xl) flex-col">
            <div className="sticky top-16 z-30 flex flex-col items-start gap-x-4 border-b border-muted-background bg-background p-4 md:flex-row md:items-center md:justify-between lg:gap-x-6 lg:p-6">
              <h1 className="mb-2 text-3xl font-extrabold tracking-tight whitespace-nowrap md:mb-0 lg:text-4xl">
                Explore Dataset
              </h1>
              <GallerySearch />
            </div>
            <Gallery />
          </section>
        </main>
      </GalleryRoot>
    </Suspense>
  );
}
