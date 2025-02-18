"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus } from "lucide-react";
import { motion } from "motion/react";
import { getIosAppById } from "@/lib/actions";

import {QRCodeSVG} from 'qrcode.react';

const DUMMY_INFO = {
  app_id: "389801252",
  platform: "ios",
  recording_link: `https://31ab-130-126-255-101.ngrok-free.app/task/670db3f487478f2c8b7824c8/upload`
}

export default function Page() {
  const [app, setApp] = useState<any>({});

  useEffect(() => {
    getIosAppById({ id: DUMMY_INFO.app_id })
      .then((app: any) => {
        setApp(app);
      })
      .catch((error: any) => {
        throw new Error(error);
      });
  }, []);

  return (
    <motion.div
      className="flex w-screen min-h-screen items-center justify-center p-4 md:p-6"
      layoutRoot
    >
      <motion.div
        className="w-full max-w-screen-md p-8 pt-4 rounded-3xl bg-neutral-50 dark:bg-neutral-950 outline outline-neutral-200 dark:outline-neutral-800"
        animate={{ height: "auto" }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 15,
          mass: 0.75,
        }}
        layout
      >
        <h1 className="w-full text-center text-xl md:text-2xl font-bold tracking-tight mb-4">
          Choose how to launch ODIM
        </h1>
        <div className="flex flex-col md:flex-row w-full gap-8">
          <div className="flex flex-col md:w-1/2">
            <article className="flex flex-col">
              <h2 className="text-lg md:text-xl font-semibold mb-2">
                Scanning a QR code
              </h2>
              <p className="text-base text-neutral-500 dark:text-neutral-400 font-medium mb-4">
                Point the camera on your phone or tablet at this QR code to
                launch ODIM.
              </p>
              <QRCodeSVG className="w-full h-auto rounded-xl object-contain aspect-square p-4 bg-white" value={DUMMY_INFO.recording_link} />
              {/* <Image
                className="w-full rounded-xl object-contain aspect-square"
                src="/demo-qr.png"
                alt="Sample QR code with deep link"
                width={0}
                height={0}
                sizes={"100vw"}
              /> */}
            </article>
          </div>
          <div className="flex flex-col md:w-1/2">
            <article className="flex flex-col">
              <h2 className="text-lg md:text-xl font-semibold mb-2">
                Manually entering a code
              </h2>
              <p className="text-base text-neutral-500 dark:text-neutral-400 font-medium mb-4">
                Go to{" "}
                <Link className="underline" href="/trace/new">
                  odim.app/trace/new
                </Link>{" "}
                and enter the following code:
              </p>
              <div className="flex items-center gap-2 has-[:disabled]:opacity-50">
                <div className="flex items-center">
                  <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800">
                    0
                  </div>
                  <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800">
                    0
                  </div>
                  <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800">
                    0
                  </div>
                </div>
                <div role="separator">
                  <Minus />
                </div>
                <div className="flex items-center">
                  <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800">
                    0
                  </div>
                  <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800">
                    0
                  </div>
                  <div className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800">
                    0
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
