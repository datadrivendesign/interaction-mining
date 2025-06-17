import Globe from "@/public/globe.svg";
import Link from "next/link";
import DatasetGallery from "./dataset-gallery";

export default async function Dataset() {
  return (
    <section
      id="dataset"
      className="grid auto-rows-auto lg:auto-rows-fr grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full max-w-screen-lg mb-6 px-6 gap-6 justify-center items-start lg:pt-16"
    >
      <div className="flex col-span-1 row-span-1 lg:row-span-2 w-full h-full p-px bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-3xl">
        <div className="flex flex-col w-full h-full p-6 bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-900 dark:to-black rounded-[calc(1.5rem-1px)] overflow-hidden">
          <h2 className="text-foreground text-3xl font-semibold tracking-tight">
            Data from real phones, not a lab.
          </h2>
          <p className="w-full max-w-md text-3xl text-muted-foreground font-medium tracking-tight mb-4">
            A growing library of organic interaction data directly from user
            devices.
          </p>
          <div className="relative z-0 w-full min-h-36">
            <Globe className="absolute z-0 object-cover w-full lg:w-[150%] h-auto stroke-neutral-200 dark:stroke-neutral-800" />
          </div>
        </div>
      </div>
      <div className="flex order-first lg:order-none col-span-1 md:col-span-2 grow w-full h-full p-px bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-3xl lg:-translate-y-1/4">
        <div className="flex flex-col items-start justify-start w-full h-full p-6 bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-900 dark:to-black rounded-[calc(1.5rem-1px)]">
          <DatasetGallery />
        </div>
      </div>
      <div className="flex col-span-1 w-full p-px bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-3xl aspect-1/1 lg:-translate-y-1/4">
        <div className="flex flex-col items-start justify-start w-full h-full p-6 bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-900 dark:to-black rounded-[calc(1.5rem-1px)]">
          <p className="text-3xl text-muted-foreground font-medium tracking-tight">
            <span className="text-foreground">
              1.9K screens
            </span>
            {" "}from{" "}
            <span className="text-foreground">176 user flows</span>
            {" "}across{" "}
            <span className="text-foreground">106 apps</span>.
          </p>
        </div>
      </div>
      <Link href="/explore" className="group flex md:hidden lg:flex col-span-1 w-full p-px bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 rounded-3xl lg:aspect-1/1" scroll={false}>
        <div className="flex flex-col items-center justify-center w-full h-full p-6 bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-900 dark:to-black group-hover:from-foreground group-hover:to-dimmed-foreground rounded-[calc(1.5rem-1px)] transition-colors duration-300 ease-in-out">
          <h2 className="text-3xl text-foreground group-hover:text-background font-medium tracking-tight transition-colors duration-300 ease-in-out">
            Explore the ODIM dataset <span className="group-hover:animate-bounce">→</span>
          </h2>
        </div>
      </Link>
    </section>
  )
}