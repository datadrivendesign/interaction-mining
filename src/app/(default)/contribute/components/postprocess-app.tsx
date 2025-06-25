import PostAppDeleteSection from "./mdx/postprocess-app-1-delete.mdx";
import PostAppRepairSection from "./mdx/postprocess-app-2-repair.mdx";
import PostAppRedactScreenSection from "./mdx/postprocess-app-3-redact-screen.mdx";
import PostAppRedactVHSection from "./mdx/postprocess-app-4-redact-vh.mdx";

export default function PostProcessApp() {
    return (
      <div className="relative flex flex-col md:flex-col w-full max-w-(--breakpoint-xl) p-4 md:p-8 gap-4 md:gap-4">  
        <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
          <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
            <PostAppDeleteSection />
          </article>
          <div className="flex justify-between items-center gap-8 mt-8">
            <div className="w-full max-w-xs mx-auto text-center">
              <video src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/delete_screens.mp4`} className="not-prose w-3/4 h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
            </div>
          </div>
        </section>
  
        <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
          <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
            <PostAppRepairSection />
          </article>
          <div className="flex justify-between items-center gap-8 mt-8">
            <div className="w-full max-w-xs mx-auto text-center">
              <video src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/add_gesture.mp4`} className="not-prose w-3/4 h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
            </div>
          </div>
        </section>
  
        <section className="flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) gap-16 md:gap-16">
          <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
            <PostAppRedactScreenSection />
            <PostAppRedactVHSection />
          </article>

        <div className="flex flex-row justify-between items-center gap-4 mt-8">
          <div className="w-full max-w-xs mx-auto text-center mr-4">
            <video src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/screen_redact_1.mp4`} className="not-prose w-full h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
          </div>
          <div className="w-full max-w-xs mx-auto text-center">
            <video src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/screen_redact_2.mp4`} className="not-prose w-full h-auto rounded-lg focus:outline-hidden focus:ring-0 mb-8" autoPlay loop playsInline muted></video>
          </div>
        </div>
        </section>
      </div>
      )
  }