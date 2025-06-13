import { GalleryRoot, GallerySearch, Gallery } from "./components/gallery";

export default async function Explore() {
  return (
    <GalleryRoot>
      <main className="relative flex flex-col grow min-h-dvh items-center">
        <section className="relative flex flex-col w-full max-w-(--breakpoint-2xl)">
          <div className="sticky top-16 z-30 flex flex-col md:flex-row p-4 lg:p-6 gap-x-4 lg:gap-x-6 items-start md:justify-between md:items-center bg-background border-b border-muted-background">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 md:mb-0 whitespace-nowrap">
              Explore Dataset
            </h1>
            <GallerySearch />
          </div>
          <Gallery />
        </section>
      </main>
    </GalleryRoot>
  );
}
