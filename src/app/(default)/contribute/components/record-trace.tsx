"use client";

import Link from "next/link";
import { ArrowUpRight, DownloadIcon } from "lucide-react";

import TraceIntroSection from "./mdx/1-traces-intro.mdx";
import TraceAppSection from "./mdx/2-traces-install.mdx";
import TraceContributeSection from "./mdx/3-traces-contribute.mdx";
import TraceCaptureSection from "./mdx/4-traces-capture.mdx";
import TraceDeleteSection from "./mdx/5-traces-delete.mdx";
import TraceTagGestureSection from "./mdx/6-traces-tag-gesture.mdx";
import TraceRedactScreenSection from "./mdx/7-traces-redact-screen.mdx";
import TraceRedactMetadataSection from "./mdx/8-traces-redact-metadata.mdx";

import { Button } from "@/components/ui/button";

export default function RecordTrace() {
  return (
    <div className="relative flex flex-col md:flex-col w-full max-w-(--breakpoint-xl) p-4 md:p-8 gap-4 md:gap-4">
      <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-4 md:gap-4">
          <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
            <TraceIntroSection />
          </article>
         <aside className="sticky top-20 flex flex-col w-full gap-2 max-w-xs">
           <Link
             href={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/apk/odim-1.0.apk`}
             target="_blank"
           >
             <Button className="w-full">
               <DownloadIcon size={20} className="mr-1" />
               Download APK
             </Button>
           </Link>
           <Button variant="secondary" className="w-full" disabled>
             <ArrowUpRight size={20} className="mr-1" />
             Source release pending
           </Button>
         </aside>
      </section>

      <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
        <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
          <TraceAppSection />
        </article>
        <div className="flex justify-between items-center gap-8 mt-8">
          <div className="w-full max-w-xs mx-auto text-center">
            <video src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/installation.mp4`} className="not-prose w-3/4 h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
          </div>
        </div>
      </section>

      <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
        <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
          <TraceContributeSection />
        </article>
        <div className="flex justify-between items-center gap-8 mt-8">
          <div className="w-full max-w-xs mx-auto text-center">
            <video src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/accessibility.mp4`} className="not-prose w-3/4 h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
          </div>
        </div>
      </section>

      <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
        <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
          <TraceCaptureSection />
        </article>
        <div className="flex justify-between items-center gap-8 mt-8">
          <div className="w-full max-w-xs mx-auto text-center">
            <video src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/traces.mp4`} className="not-prose w-3/4 h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
          </div>
        </div>
      </section>

      <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
        <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
          <TraceDeleteSection />
        </article>
        <div className="flex justify-between items-center gap-8 mt-8">
          <div className="w-full max-w-xs mx-auto text-center">
            <video src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/delete_screens.mp4`} className="not-prose w-3/4 h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
          </div>
        </div>
      </section>

      <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
        <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
          <TraceTagGestureSection />
        </article>
        <div className="flex justify-between items-center gap-8 mt-8">
          <div className="w-full max-w-xs mx-auto text-center">
            <video src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/add_gesture.mp4`} className="not-prose w-3/4 h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
          </div>
        </div>
      </section>

      <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
        <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
          <TraceRedactScreenSection />
        </article>
        <div className="flex justify-between items-center gap-8 mt-8">
          <div className="w-full max-w-xs mx-auto text-center">
            <video src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/screen_redact_1.mp4`} className="not-prose w-3/4 h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-4" autoPlay loop playsInline muted></video>
          </div>
        </div>
      </section>

      <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
        <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
          <TraceRedactMetadataSection />
        </article>
        <div className="flex justify-between items-center gap-8 mt-8">
          <div className="w-full max-w-xs mx-auto text-center">
            <video src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/screen_redact_2.mp4`} className="not-prose w-3/4 h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-4" autoPlay loop playsInline muted></video>
          </div>
        </div>
      </section>
    </div>
    )
}