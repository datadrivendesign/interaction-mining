import NavigationBar from "@/app/(default)/components/navigation-bar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <NavigationBar />
      <main className="flex h-full w-full grow flex-col items-center justify-center">
        <h2 className="text-4xl font-black tracking-tight lg:text-6xl">
          Not Found
        </h2>
        <p className="text-lg font-medium lg:text-xl">
          Could not find requested resource.
        </p>
        <Link
          href="/"
          className="inline-flex items-center text-lg text-neutral-500 lg:text-xl"
        >
          <ArrowLeft className="mr-1 size-4 lg:size-5" />
          Return Home
        </Link>
      </main>
    </>
  );
}
