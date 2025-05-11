"use client";

import Link from "next/link";
import { ArrowUpRight, DownloadIcon } from "lucide-react";

import InstallInstructions from "./components/install-instructions.mdx";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <>
      <main className="relative flex flex-col grow min-h-dvh items-center justify-between">
        <section className="relative flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) p-8 md:p-16 gap-8 md:gap-16">
          <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
            <InstallInstructions />
          </article>
          <aside className="sticky top-12 flex flex-col w-full gap-2 max-w-xs">
            <Link
              href="https://mobileodimbucket155740-dev.s3.us-east-2.amazonaws.com/apk/odim-3.0.apk"
              target="_blank"
            >
              <Button className="w-full">
                <DownloadIcon size={20} className="mr-1" />
                Download Latest (v3.0)
              </Button>
            </Link>
            <Button variant="secondary" className="w-full" disabled>
              <ArrowUpRight size={20} className="mr-1" />
              Source release pending
            </Button>
          </aside>
        </section>
      </main>
    </>
  );
}
