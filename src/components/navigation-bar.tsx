import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function NavigationBar() {
  return (
    <>
      <nav className="sticky z-40 top-0 flex w-full justify-center bg-white dark:bg-black">
        <div className="flex w-full max-w-screen-2xl px-4 py-4 justify-between">
          <div className="flex basis-1/2 h-full">
            <Link
              href={"/"}
              className="text-2xl font-title tracking-tighter"
              style={{ fontWeight: 900, fontStretch: "ultra-expanded" }}
            >
              ODIM
            </Link>
          </div>
          <div className="flex basis-1/2 h-full gap-8 justify-end items-center">
            <Link href={"/explore"}>
              <span className="inline-flex items-center text-sm font-medium">
                Explore
              </span>
            </Link>
            <Link href={"/contribute"}>
              <span className="inline-flex items-center text-sm font-medium">
                Contribute
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
