"use client";

import Link from "next/link";
import { DownloadIcon } from "lucide-react";

import TraceIntroSection from "./mdx/traces-1-intro.mdx";
import TraceAppSection from "./mdx/traces-2-install.mdx";
import TraceContributeSection from "./mdx/traces-3-contribute.mdx";
import TraceCaptureSection from "./mdx/traces-4-capture.mdx";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostProcessWeb from "./mdx/postprocess-web.mdx";
import PostProcessApp from "./postprocess-app";

export default function RecordTrace() {
  return (
    <div className="relative flex flex-col md:flex-col w-full max-w-(--breakpoint-xl) p-4 md:p-8 gap-4 md:gap-4">
      <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
          <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
            <TraceIntroSection />
            <TraceAppSection />
          </article>

        <div className="flex flex-row md:flex-col justify-center content-center items-center">
          <aside className="top-20 flex flex-col w-full gap-2 max-w-xs">
            <Link
              href={`https://dhyjzbfmbeej1.cloudfront.net/assets/apk/odim-1.0.apk`}
              target="_blank"
            >
              <Button className="w-full">
                <DownloadIcon size={20} className="mr-1" />
                Download APK
              </Button>
            </Link>
          </aside>
          <div className="flex justify-between justify-center content-center items-center gap-8 mt-8">
            <div className="w-full max-w-xs mx-auto text-center">
              <video src={`https://dhyjzbfmbeej1.cloudfront.net/assets/accessibility.mp4`} className="not-prose w-3/4 h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
            </div>
          </div>
        </div>          
      </section>

      <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
        <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
          <TraceContributeSection />
        </article>
      </section>

      <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
        <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
          <TraceCaptureSection />
        </article>
        <div className="flex flex-row justify-between items-center gap-8 mt-8">
          <div className="w-full max-w-xs mx-auto text-center mr-8">
            <video src={`https://dhyjzbfmbeej1.cloudfront.net/assets/accessibility.mp4`} className="not-prose w-full h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
          </div>
          <div className="w-full max-w-xs mx-auto text-center">
            <video src={`https://dhyjzbfmbeej1.cloudfront.net/assets/traces.mp4`} className="not-prose w-full h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
          </div>
        </div>
      </section>

      <Tabs defaultValue="postprocess-web" className="w-full max-w-(--breakpoint-xl) p-4">
        <TabsList className="sticky left-10">
          <TabsTrigger value="postprocess-web">
            Post-Process on Web App
          </TabsTrigger>
          <TabsTrigger value="postprocess-mobile">
            Post-Process on Mobile App
          </TabsTrigger>
        </TabsList>
        <TabsContent value="postprocess-web">
          <section className="relative flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) p-4 md:p-8 gap-8 md:gap-16">
            <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
              <PostProcessWeb />
            </article>
          </section>
        </TabsContent>
        <TabsContent value="postprocess-mobile">
          <PostProcessApp />
        </TabsContent>
      </Tabs>
    </div>
  )
}