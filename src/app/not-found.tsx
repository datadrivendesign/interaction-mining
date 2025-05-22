import NavigationBar from "@/app/(default)/components/navigation-bar";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <NavigationBar />
      <main className="flex flex-col grow w-full h-full justify-center items-center">
        <h2 className="text-4xl lg:text-6xl font-black tracking-tight">
          Not Found
        </h2>
        <p className="text-lg lg:text-xl font-medium">
          Could not find requested resource.
        </p>
        <Link
          href="/"
          className="inline-flex items-center text-lg lg:text-xl text-neutral-500"
        >
          <ArrowLeft className="size-4 lg:size-5 mr-1" />
          Return Home
        </Link>
      </main>
    </>
  );
}
