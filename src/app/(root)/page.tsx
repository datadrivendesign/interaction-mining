import Link from "next/link";
import { ArrowRight, ArrowUpRight, Eye, EyeClosed, Hammer, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between">
      <section
        id="hero"
        className="relative flex flex-col w-full max-w-(--breakpoint-2xl) h-[60dvh]"
      >
        <div className="flex flex-col grow w-full p-16 justify-center items-start">
          <h1 className="text-9xl font-title tracking-tighter font-black font-stretch-200%">
            ODIM
          </h1>
          <p className="max-w-full lg:max-w-1/2 text-3xl lg:text-4xl font-display font-normal tracking-tight mb-4">
            Novel in-the-wild user interaction data collection architecture and
            repository.
          </p>
          <div className="flex gap-4">
            <Link
              href="/explore"
              className="px-4 py-2 bg-neutral-100 rounded-xl"
            >
              <span className="inline-flex items-center text-xl text-black font-medium">
                Explore data <ArrowRight size={24} className="ml-1" />
              </span>
            </Link>
            <Link href="/contribute" className="px-4 py-2 bg-black rounded-xl">
              <span className="inline-flex items-center text-xl text-white font-medium">
                Try ODIM <ArrowUpRight size={24} className="ml-1" />
              </span>
            </Link>
          </div>
        </div>
      </section>
      <section
        id="about-the-project"
        className="grid grid-cols-3 w-full px-8 gap-8 justify-center items-start"
      >
        <div className="flex col-span-1 w-full p-12 bg-neutral-50 dark:bg-neutral-950 rounded-6xl aspect-1/1">
          <p className="text-3xl lg:text-4xl font-display font-normal tracking-tight text-neutral-500 dark:text-neutral-400">
            ODIM is a privacy-first framework for collecting authentic
            in-the-wild user interaction data.
          </p>
        </div>
        <div className="flex col-span-2 w-full h-full p-12 bg-neutral-50 dark:bg-neutral-950 rounded-6xl">
          <p className="text-3xl lg:text-4xl font-display font-normal tracking-tight text-neutral-500 dark:text-neutral-400">
            ODIM is a privacy-first framework for collecting authentic
            in-the-wild user interaction data.
          </p>
        </div>
        <div className="flex flex-col col-span-1 w-full p-12 bg-green-200 dark:bg-green-800  rounded-6xl aspect-1/1">
          <Hammer size={64} className="text-green-400 dark:text-green-300 mb-8" />
          <p className="text-3xl lg:text-4xl font-display font-semibold tracking-tight text-green-400 dark:text-green-300">
            Repair
          </p>
        </div>
        <div className="flex flex-col col-span-1 w-full p-12 bg-purple-200 dark:bg-purple-800 rounded-6xl aspect-1/1">
          <Eye size={64} className="text-purple-400 dark:text-purple-300 mb-8" />
          <p className="text-3xl lg:text-4xl font-display font-semibold tracking-tight text-purple-400 dark:text-purple-300">
            Redact
          </p>
        </div>
        <div className="flex flex-col col-span-1 w-full p-12 bg-blue-200 dark:bg-blue-800 rounded-6xl aspect-1/1">
          <Sparkles size={64} className="text-blue-400 dark:text-blue-300 mb-8" />
          <p className="text-3xl lg:text-4xl font-display font-semibold tracking-tight text-blue-400 dark:text-blue-300">
            Enrich
          </p>
        </div>
      </section>
      <div className="pb-8"></div>
    </main>
  );
}
