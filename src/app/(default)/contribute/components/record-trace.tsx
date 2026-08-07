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
    <div className="relative flex w-full max-w-(--breakpoint-xl) flex-col gap-4 p-4 md:flex-col md:gap-4 md:p-8">
      <section className="flex w-full max-w-(--breakpoint-xl) flex-col gap-16 md:flex-row md:gap-16">
        <article className="prose w-full leading-snug prose-neutral dark:prose-invert">
          <TraceIntroSection />
          <TraceAppSection />
        </article>

        <div className="flex flex-row content-center items-center justify-center md:flex-col">
          <aside className="top-20 flex w-full max-w-xs flex-col gap-2">
            <Link
              href={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/apk/odim-1.0.apk`}
              target="_blank"
            >
              <Button className="w-full">
                <DownloadIcon size={20} className="mr-1" />
                Download APK
              </Button>
            </Link>
          </aside>
          <div className="mt-8 flex content-center items-center justify-between justify-center gap-8">
            <div className="mx-auto w-full max-w-xs text-center">
              <video
                src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/accessibility.mp4`}
                className="not-prose mb-8 h-auto w-3/4 rounded-lg focus:ring-0 focus:outline-hidden"
                autoPlay
                loop
                playsInline
                muted
              ></video>
            </div>
          </div>
        </div>
      </section>

      <section className="flex w-full max-w-(--breakpoint-xl) flex-col gap-16 md:flex-row md:gap-16">
        <article className="prose w-full leading-snug prose-neutral dark:prose-invert">
          <TraceContributeSection />
        </article>
      </section>

      <section className="flex w-full max-w-(--breakpoint-xl) flex-col gap-16 md:flex-row md:gap-16">
        <article className="prose w-full leading-snug prose-neutral dark:prose-invert">
          <TraceCaptureSection />
        </article>
        <div className="mt-8 flex flex-row items-center justify-between gap-8">
          <div className="mx-auto mr-8 w-full max-w-xs text-center">
            <video
              src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/accessibility.mp4`}
              className="not-prose mb-8 h-auto w-full rounded-lg focus:ring-0 focus:outline-hidden"
              autoPlay
              loop
              playsInline
              muted
            ></video>
          </div>
          <div className="mx-auto w-full max-w-xs text-center">
            <video
              src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/traces.mp4`}
              className="not-prose mb-8 h-auto w-full rounded-lg focus:ring-0 focus:outline-hidden"
              autoPlay
              loop
              playsInline
              muted
            ></video>
          </div>
        </div>
      </section>

      <Tabs
        defaultValue="postprocess-web"
        className="w-full max-w-(--breakpoint-xl) p-4"
      >
        <TabsList className="sticky left-10">
          <TabsTrigger value="postprocess-web">
            Post-Process on Web App
          </TabsTrigger>
          <TabsTrigger value="postprocess-mobile">
            Post-Process on Mobile App
          </TabsTrigger>
        </TabsList>
        <TabsContent value="postprocess-web">
          <section className="relative flex w-full max-w-(--breakpoint-xl) flex-col gap-8 p-4 md:flex-row md:gap-16 md:p-8">
            <article className="prose w-full leading-snug prose-neutral dark:prose-invert">
              <PostProcessWeb />
            </article>
          </section>
        </TabsContent>
        <TabsContent value="postprocess-mobile">
          <PostProcessApp />
        </TabsContent>
      </Tabs>
    </div>
  );
}
