import { Heart } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="flex flex-col w-full justify-center items-center">
      <div className="flex flex-col items-center max-w-screen-xl p-4 md:p-6 gap-4">
        <Image className="w-fit h-12 mb-2" src="/illinois_logo.png" alt="University of Illinois Urbana-Champaign Logo" width={0} height={0} sizes="100vw" />
        <div className="flex text-sm text-muted-foreground *:px-2 md:*:px-3 *:not-last:border-r *:border-muted-foreground/25">
          <p>Get a Demo</p>
          <p>Content Policy</p>
          <p>Terms of Service</p>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Data-Driven Design Group. All rights reserved.
        </p>
      </div>
      {/* <div className="grid grid-cols-1 md:grid-cols-3 items-center justify-between w-full max-w-screen-lg p-4 md:p-6 gap-4 text-sm text-muted-foreground">
        <div className="flex flex-col items-start">
          <Image className="w-auto h-12 mb-2" src="/illinois_logo.png" alt="University of Illinois Urbana-Champaign Logo" width={0} height={0} sizes="100vw" />
          <p>
            © {new Date().getFullYear()} Data-Driven Design Group
          </p>
        </div>
        <p className="inline-flex items-center">
          Built by the Interaction Mining team.
        </p>
      </div> */}
    </footer>
  );
}