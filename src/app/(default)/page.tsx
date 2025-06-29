import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Dataset from "./components/dataset";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between">
      {/* Announcement banner */}
      <section id="banner" className="flex justify-center items-center w-full max-w-screen-2xl p-4 md:p-6">
        <span className="px-3 py-1 mr-2 rounded-full bg-blue-500 dark:bg-blue-500/50 text-sm text-white dark:text-blue-300 font-semibold">Info</span>
        <span className="text-md font-medium">Looking for the Rico dataset?</span>
        <Link
          href="/archive/rico"
          className="px-3 py-1 ml-2 bg-foreground rounded-full hover:bg-foreground/90 text-sm text-background font-medium transition-colors duration-150 ease-in-out"
        >
          Take me there →
        </Link>
      </section>
      {/* Masthead */}
      <section
        id="hero"
        className="relative flex flex-col w-full max-w-screen-2xl p-4 md:p-16 lg:p-24"
      >
        <div className="flex flex-col grow w-full justify-center items-center">
          <p className="w-auto max-w-xl text-center text-lg lg:text-xl text-muted-foreground font-medium mb-2">
            Introducing ODIM
          </p>
          <h1 className="w-full max-w-5xl text-center text-5xl lg:text-6xl text-foreground font-black tracking-tight mb-2">
            Your complete mobile interaction dataset and collection platform
          </h1>
          <p className="w-auto max-w-xl text-center text-lg lg:text-xl text-muted-foreground font-medium mb-4">
            On-device interaction-mining (ODIM) provides a platform for collecting, managing, and sharing
            mobile interaction datasets on a single, open platform
          </p>
          <div className="flex gap-6">
            <Link
              href="/explore"
              className="px-4 py-2 bg-foreground hover:bg-foreground/90 rounded-xl transition-colors duration-150 ease-in-out"
            >
              <span className="inline-flex items-center text-lg lg:text-xl text-background font-medium">
                Explore dataset <ArrowRight size={24} className="ml-1" />
              </span>
            </Link>
            <Link
              href="/contribute"
              className="px-4 py-2 bg-muted-background hover:bg-muted-background/90 rounded-xl transition-colors duration-150 ease-in-out"
            >
              <span className="inline-flex items-center text-lg lg:text-xl text-foreground font-medium">
                Get Involved
              </span>
            </Link>
          </div>
        </div>
      </section>
      {/* Dataset section */}
      <Dataset />

      {/* Platform section */}
      {/* <Platform /> */}
      <div className="pb-8 lg:pb-16"></div>
    </main>
  );
}
