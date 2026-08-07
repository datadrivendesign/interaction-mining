import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Dataset from "./components/dataset";
import Footer from "./components/footer";
import DatasetGallery from "./components/dataset-gallery";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between">
      {/* Announcement banner */}
      {/* <section id="banner" className="flex justify-center items-center w-full max-w-screen-2xl p-4 md:p-6">
        <span className="px-3 py-1 mr-2 rounded-full bg-blue-500 dark:bg-blue-500/50 text-sm text-white dark:text-blue-300 font-semibold">Info</span>
        <span className="text-md font-medium">Looking for the Rico dataset?</span>
        <Link
          href="/archive/rico"
          className="px-3 py-1 ml-2 bg-foreground rounded-full hover:bg-foreground/90 text-sm text-background font-medium transition-colors duration-150 ease-in-out"
        >
          Take me there →
        </Link>
      </section> */}
      {/* Masthead */}
      <section
        id="hero"
        className="relative flex w-full max-w-screen-2xl flex-col items-center gap-4 px-4 py-12 lg:gap-6 lg:px-6 lg:py-18"
      >
        <h1 className="w-full max-w-5xl text-center text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Interaction and Design Data <br className="hidden sm:block" />
          for Mobile Apps
        </h1>
        <div className="relative z-0 col-span-1 -mb-4 flex h-full w-full max-w-screen-md grow rounded-3xl bg-gradient-to-b from-neutral-100 to-neutral-200 p-px md:col-span-2 lg:-mb-6 dark:from-neutral-800 dark:to-neutral-900">
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 flex h-full w-full items-end justify-center bg-gradient-to-b from-transparent from-25% to-background to-90%">
            <Link className="mb-8 block md:hidden lg:mb-12" href="/explore">
              <Button>
                Explore dataset <ArrowRight size={24} />
              </Button>
            </Link>
          </div>
          <div className="flex h-full w-full flex-col items-start justify-start rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-white to-neutral-100 p-6 dark:from-neutral-900 dark:to-black">
            <DatasetGallery />
          </div>
        </div>
        <p className="w-auto max-w-xl text-center text-lg font-medium text-muted-foreground lg:text-xl">
          Interaction Mining is an open platform for collecting, managing, and
          sharing mobile interaction datasets.
        </p>
        {/* <div className="relative z-10 flex flex-col grow w-full justify-center items-center">
          <div className="flex gap-6">
            
            <Link
              href="/contribute"
              className="px-4 py-2 bg-muted-background hover:bg-muted-background/90 rounded-xl transition-colors duration-150 ease-in-out"
            >
              <span className="inline-flex items-center text-lg lg:text-xl text-foreground font-medium">
                Get Involved
              </span>
            </Link>
          </div>
        </div> */}
      </section>
      {/* Dataset section */}
      <Dataset />

      {/* Platform section */}
      {/* <Platform /> */}
      <Footer />
    </main>
  );
}
