import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import Globe from "@/public/globe.svg";
import { InputRoot, InputIcon, Input } from "@/components/ui/input-icon";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-between">
      <section id="banner" className="flex justify-center items-center w-full max-w-screen-2xl p-4">
        <span className="px-3 py-1 mr-2 rounded-full bg-blue-500/50 text-sm text-blue-300 font-semibold">Info</span>
        <span className="text-md font-medium">Looking for the Rico dataset?</span>
        <Link
          href="/archive/rico"
          className="px-3 py-1 ml-2 bg-foreground rounded-full hover:bg-foreground/90 text-sm text-background font-medium transition-colors duration-150 ease-in-out"
        >
          Take me there →
        </Link>
      </section>
      <section
        id="hero"
        className="relative flex flex-col w-full max-w-screen-2xl p-24 md:p-28 lg:p-32"
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
          <div className="flex gap-4">
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
              <span className="inline-flex items-center text-lg lg:text-xl text-white font-medium">
                Contribute to dataset
              </span>
            </Link>
          </div>
        </div>
      </section>
      <section
        id="dataset"
        className="grid grid-cols-4 w-full max-w-screen-lg mb-6 px-8 gap-6 justify-center items-start"
      >
        <div className="flex col-span-4 w-full h-full p-px bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl">
          <div className="flex flex-col md:flex-row w-full h-full p-8 gap-8 bg-gradient-to-br from-neutral-900 to-black rounded-[calc(1.5rem-1px)] overflow-hidden">
            <div className="flex flex-col basis-2/3 lg:basis-1/2">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Data from real phones, not a lab.
              </h2>
              <p className="w-full max-w-md text-2xl text-muted-foreground font-medium tracking-tight mb-4">
                A growing library of organic interaction data directly from user
                devices.
              </p>
              <InputRoot>
                <InputIcon>
                  <Search className="size-4 text-muted-foreground" />
                </InputIcon>
                <Input placeholder="Search for an app, flow, or screen..." />
              </InputRoot>
            </div>
            <div className="relative z-0 flex grow basis-1/2 lg:basis-auto min-h-36">
              <Globe className="absolute z-0 object-cover w-full h-auto" />
            </div>
          </div>
        </div>
        <div className="flex col-span-1 w-full p-px bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl aspect-1/1">
          <div className="flex flex-col items-start justify-start w-full h-full p-8 bg-gradient-to-br from-neutral-900 to-black rounded-[calc(1.5rem-1px)]">
            <span className="text-foreground text-4xl font-black tracking-tight">
              1.9K
            </span>
            <p className="text-2xl text-muted-foreground font-medium tracking-tight">
              screens
            </p>
          </div>
        </div>
        <div className="flex col-span-1 w-full p-px bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl aspect-1/1">
          <div className="flex flex-col items-start justify-start w-full h-full p-8 bg-gradient-to-br from-neutral-900 to-black rounded-[calc(1.5rem-1px)]">
            <span className="text-foreground text-4xl font-black tracking-tight">
              176
            </span>
            <p className="text-2xl text-muted-foreground font-medium tracking-tight">
              user flows
            </p>
          </div>
        </div>
        <div className="flex col-span-1 w-full p-px bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl aspect-1/1">
          <div className="flex flex-col items-start justify-start w-full h-full p-8 bg-gradient-to-br from-neutral-900 to-black rounded-[calc(1.5rem-1px)]">
            <span className="text-foreground text-4xl font-black tracking-tight">
              106
            </span>
            <p className="text-2xl text-muted-foreground font-medium tracking-tight">
              apps explored
            </p>
          </div>
        </div>
        <Link href="/explore" className="group flex col-span-1 w-full p-px bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl aspect-1/1">
          <div className="flex flex-col items-center justify-center w-full h-full p-8 bg-gradient-to-br from-muted-background to-dimmed-background group-hover:from-foreground group-hover:to-dimmed-foreground rounded-[calc(1.5rem-1px)] transition-colors duration-300 ease-in-out">
            <h2 className="text-4xl text-foreground group-hover:text-background font-medium tracking-tight transition-colors duration-300 ease-in-out">
              Explore the dataset <span className="group-hover:animate-bounce">→</span>
            </h2>
          </div>
        </Link>
      </section>
      <section
        id="platform"
        className="grid grid-cols-3 w-full max-w-screen-lg px-8 gap-6 justify-center items-start"
      >
        <div className="flex col-span-3 w-full h-full p-px bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-3xl">
          <div className="flex flex-col md:flex-row w-full h-full p-8 gap-8 bg-gradient-to-br from-neutral-900 to-black rounded-[calc(1.5rem-1px)] overflow-hidden">
            <div className="flex flex-col basis-3/5">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight sr-only">
                Built on trust.
              </h2>
              <p className="w-full text-2xl text-muted-foreground font-medium tracking-tight mb-4">
                <span className="text-foreground text-2xl font-semibold tracking-tight">
                  Built on trust.
                </span>{" "}
                Contributers collect, clean, and annotate their own interaction data before sharing it.
              </p>
              <p className="inline-flex items-center w-full max-w-md text-2xl text-muted-foreground font-medium tracking-tight">
                Let's try{" "}<span className="px-3 py-1 mx-2 rounded-full ring ring-neutral-200 dark:ring-neutral-800 text-foreground cursor-pointer">repairing</span>{" "}your trace.
              </p>
            </div>
            <div className="flex justify-center items-center basis-2/5 aspect-video p-8 bg-muted-background rounded-2xl">
              <span className="text-foreground text-6xl font-black tracking-tight">
                SICK INTERACTIVE DEMO HERE
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="pb-8 lg:pb-16"></div>
    </main>
  );
}
