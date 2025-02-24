"use client";

import Link from "next/link";
import { ArrowUpRight, DownloadIcon } from "lucide-react";

import InstallInstructions from "./components/install-instructions.mdx";

export default function Page() {
  return (
    <>
      <main className="relative flex flex-col grow min-h-dvh items-center justify-between">
        <section className="relative flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) p-8 md:p-16 gap-8 md:gap-16">
          <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
            <InstallInstructions />
          </article>
          <aside className="sticky top-12 flex flex-col w-full max-w-xs">
            <Link
              href="https://mobileodimbucket155740-dev.s3.us-east-2.amazonaws.com/apk/odim-3.0.apk"
              className="px-3 py-2 bg-neutral-800 rounded-xl mb-2"
            >
              <span className="flex justify-between items-center text-base text-white font-medium">
                Download Latest (v3.0)
                <DownloadIcon size={20} className="ml-1 stroke-4" />
              </span>
            </Link>
            <Link href="/" className="px-3 py-2 bg-neutral-100 rounded-xl">
              <span className="flex justify-between items-center text-base text-neutral-900 font-medium">
                View Source
                <ArrowUpRight size={20} className="ml-1 stroke-4" />
              </span>
            </Link>
          </aside>
        </section>
      </main>
    </>
  );
}
