import "@/styles/github-dark.css";
import Footer from "../../components/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex flex-col items-center w-dvw min-h-dvh p-8">
        <article
          className="flex flex-col grow w-full max-w-screen-sm prose prose-neutral dark:prose-invert prose-p:text-justify prose-pre:p-0"
        >
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
