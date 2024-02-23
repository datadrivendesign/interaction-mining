import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function NavigationBar() {
  return (
    <>
      <nav className="sticky z-40 top-0 flex w-full justify-center bg-white">
        <div className="flex basis-screen-2xl px-16 py-2 justify-between">
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
              <span className="inline-flex items-center text-sm text-black font-medium">
                Explore
              </span>
            </Link>
            <Link href={"/download"}>
              <span className="inline-flex items-center text-sm text-black font-medium">
                Try ODIM <ArrowUpRight size={20} className="ml-1 stroke-4" />
              </span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
