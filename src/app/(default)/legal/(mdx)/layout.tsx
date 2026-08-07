import "@/styles/github-dark.css";
import Footer from "../../components/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex min-h-dvh w-dvw flex-col items-center p-8">
        <article className="prose flex w-full max-w-screen-sm grow flex-col prose-neutral dark:prose-invert prose-p:text-justify prose-pre:p-0">
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
