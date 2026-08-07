import PostAppDeleteSection from "./mdx/postprocess-app-1-delete.mdx";
import PostAppRepairSection from "./mdx/postprocess-app-2-repair.mdx";
import PostAppRedactScreenSection from "./mdx/postprocess-app-3-redact-screen.mdx";
import PostAppRedactVHSection from "./mdx/postprocess-app-4-redact-vh.mdx";

export default function PostProcessApp() {
  return (
    <div className="relative flex w-full max-w-(--breakpoint-xl) flex-col gap-4 p-4 md:flex-col md:gap-4 md:p-8">
      <section className="flex w-full max-w-(--breakpoint-xl) flex-col gap-16 md:flex-row md:gap-16">
        <article className="prose w-full leading-snug prose-neutral dark:prose-invert">
          <PostAppDeleteSection />
        </article>
        <div className="mt-8 flex items-center justify-between gap-8">
          <div className="mx-auto w-full max-w-xs text-center">
            <video
              src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/delete_screens.mp4`}
              className="not-prose mb-8 h-auto w-3/4 rounded-lg focus:ring-0 focus:outline-hidden"
              autoPlay
              loop
              playsInline
              muted
            ></video>
          </div>
        </div>
      </section>

      <section className="flex w-full max-w-(--breakpoint-xl) flex-col gap-16 md:flex-row md:gap-16">
        <article className="prose w-full leading-snug prose-neutral dark:prose-invert">
          <PostAppRepairSection />
        </article>
        <div className="mt-8 flex items-center justify-between gap-8">
          <div className="mx-auto w-full max-w-xs text-center">
            <video
              src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/add_gesture.mp4`}
              className="not-prose mb-8 h-auto w-3/4 rounded-lg focus:ring-0 focus:outline-hidden"
              autoPlay
              loop
              playsInline
              muted
            ></video>
          </div>
        </div>
      </section>

      <section className="flex w-full max-w-(--breakpoint-xl) flex-col gap-16 md:flex-row md:gap-16">
        <article className="prose w-full leading-snug prose-neutral dark:prose-invert">
          <PostAppRedactScreenSection />
          <PostAppRedactVHSection />
        </article>

        <div className="mt-8 flex flex-row items-center justify-between gap-4">
          <div className="mx-auto mr-4 w-full max-w-xs text-center">
            <video
              src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/screen_redact_1.mp4`}
              className="not-prose mb-8 h-auto w-full rounded-lg focus:ring-0 focus:outline-hidden"
              autoPlay
              loop
              playsInline
              muted
            ></video>
          </div>
          <div className="mx-auto w-full max-w-xs text-center">
            <video
              src={`${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/assets/screen_redact_2.mp4`}
              className="not-prose mb-8 h-auto w-full rounded-lg focus:ring-0 focus:outline-hidden"
              autoPlay
              loop
              playsInline
              muted
            ></video>
          </div>
        </div>
      </section>
    </div>
  );
}
