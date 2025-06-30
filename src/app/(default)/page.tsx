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
        className="relative flex flex-col items-center w-full max-w-screen-2xl px-4 py-12 lg:px-6 lg:py-18 gap-4 lg:gap-6"
      >
        <h1 className="w-full max-w-5xl text-center text-4xl md:text-5xl lg:text-6xl text-foreground font-black tracking-tight">
          Interaction and Design Data <br className="hidden sm:block" />
          for Mobile Apps
        </h1>
        <div className="relative z-0 flex col-span-1 md:col-span-2 grow w-full max-w-screen-md h-full p-px -mb-4 lg:-mb-6 bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-3xl">
          <div className="absolute z-10 bottom-0 left-0 right-0 flex w-full h-full justify-center items-end bg-gradient-to-b from-transparent from-25% to-background to-90% pointer-events-none">
            <Link
              className="block md:hidden mb-8 lg:mb-12"
              href="/explore"
            >
              <Button>
                Explore dataset <ArrowRight size={24} />
              </Button>
            </Link>
          </div>
          <div className="flex flex-col items-start justify-start w-full h-full p-6 bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-900 dark:to-black rounded-[calc(1.5rem-1px)]">
            <DatasetGallery />
          </div>
        </div>
        <p className="w-auto max-w-xl text-center text-lg lg:text-xl text-muted-foreground font-medium">
          Interaction Mining is an open platform for collecting, managing, and sharing
          mobile interaction datasets.
        </p>
        {/* <div className="relative z-10 flex flex-col grow w-full justify-center items-center">
          <div className="flex gap-6">
            
            <Link
              href="/contribute"
              className="px-4 py-2 bg-muted-background hover:bg-muted-background/90 rounded-xl transition-colors duration-150 ease-in-out"
            >
              <span className="inline-flex items-center text-lg lg:text-xl text-foreground font-medium">
                Capture a trace
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
