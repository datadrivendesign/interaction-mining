import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between">
      <section id="hero" className="relative flex flex-col w-full max-w-screen-2xl h-[60dvh]">
        <div className="flex flex-col grow w-full p-16 justify-center items-start">
          <h1
            className="text-9xl font-title tracking-tighter"
            style={{ fontWeight: 900, fontStretch: "ultra-expanded" }}
          >
            ODIM
          </h1>
          <p className="text-3xl lg:text-4xl text-neutral-700 font-display font-normal tracking-tight mb-4">
            Novel on-device interaction mining for Android.
          </p>
          <div className="flex gap-4">
            <Link
              href="/download"
              className="px-4 py-2 bg-neutral-100 rounded-xl"
            >
              <span className="inline-flex items-center text-xl text-black font-medium">
                Try ODIM <ArrowUpRight size={24} className="ml-1 stroke-4" />
              </span>
            </Link>
            <Link
              href="/explore"
              className="px-4 py-2 bg-black rounded-xl"
            >
              <span className="inline-flex items-center text-xl text-white font-medium">
                Explore data <ArrowRight size={24} className="ml-1 stroke-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>
      <section
        id="about-the-project"
        className="flex flex-col w-full max-w-screen-2xl px-8 gap-8 justify-center items-start"
      >
        <div className="flex gap-8 p-16 bg-neutral-50 rounded-6xl aspect-[2/1]">
          <div className="flex flex-col w-1/2">
            <p className="text-3xl lg:text-4xl text-neutral-700 font-display font-normal tracking-tight">
              ODIM is a novel interaction mining framework that captures app
              interaction data on Android.
            </p>
          </div>
          <div className="flex flex-col w-1/2"></div>
        </div>
        <div className="flex gap-8 p-16 bg-neutral-50 rounded-6xl aspect-[2/1]">
          <div className="flex flex-col w-1/2">
            <p className="text-3xl lg:text-4xl text-neutral-700 font-display font-normal tracking-tight">
              ODIM is a novel interaction mining framework that captures app
              interaction data on Android.
            </p>
          </div>
          <div className="flex flex-col w-1/2"></div>
        </div>
        <div className="flex gap-8 p-16 bg-neutral-50 rounded-6xl aspect-[2/1]">
          <div className="flex flex-col w-1/2">
            <p className="text-3xl lg:text-4xl text-neutral-700 font-display font-normal tracking-tight">
              ODIM is a novel interaction mining framework that captures app
              interaction data on Android.
            </p>
          </div>
          <div className="flex flex-col w-1/2"></div>
        </div>
      </section>
    </main>
  );
}
