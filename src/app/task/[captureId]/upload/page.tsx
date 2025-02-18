"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { getIosAppById } from "@/lib/actions";

export default function Page() {
  const [app, setApp] = useState<any>({});

  useEffect(() => {
    getIosAppById({ id: "389801252" })
      .then((app: any) => {
        setApp(app);
      })
      .catch((error: any) => {
        throw new Error(error);
      });
  }, []);

  return (
    <motion.div
      className="flex w-full grow justify-center p-4 md:p-6"
      layoutRoot
    >
      <Tabs defaultValue="overview" className="flex flex-col grow w-full">
        <div className="flex w-full mb-4 md:mb-6 justify-center">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex flex-col grow w-full max-w-screen-md p-8 pt-4 rounded-3xl bg-neutral-50 dark:bg-neutral-950 outline outline-neutral-200 dark:outline-neutral-800">
          <TabsContent value="overview" className="flex flex-col w-full grow">
            <article className="prose prose-neutral dark:prose-invert leading-snug">
              <h2>
                Task Overview
              </h2>
              <p>
                This task requires you to install the target app and complete
                the following steps.
              </p>
              <ol>
                <li>Install the target app</li>
                <li>Complete the setup</li>
                <li>Upload the required files</li>
              </ol>
            </article>
          </TabsContent>
          <TabsContent value="setup" className="flex flex-col w-full">
            <h1 className="w-full text-center text-xl md:text-2xl font-bold tracking-tight mb-4">
              Install the target app
            </h1>
            <div className="flex flex-col">
              <div className="flex w-full p-4 gap-4 bg-neutral-100 dark:bg-neutral-900 rounded-2xl">
                <figure className="w-full max-w-24">
                  {app?.icon ? (
                    <Image
                      className="w-full rounded-3xl object-contain aspect-square"
                      src={app?.icon}
                      alt={`${app.title} icon`}
                      width={0}
                      height={0}
                      sizes={"100vw"}
                    />
                  ) : (
                    <div className="w-full rounded-3xl object-contain aspect-square bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                  )}
                </figure>
                <div className="flex flex-col justify-between items-start">
                  <div className="flex flex-col">
                    {app?.title ? (
                      <h2 className="text-lg md:text-xl font-semibold">
                        {app?.title}
                      </h2>
                    ) : (
                      <span className="w-24 h-4.5 md:h-5 bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-3"></span>
                    )}
                    {app?.developer ? (
                      <p className="text-base font-medium text-neutral-500 dark:text-neutral-400">
                        {app?.developer}
                      </p>
                    ) : (
                      <span className="w-24 h-4 bg-neutral-200 dark:bg-neutral-800 animate-pulse"></span>
                    )}
                  </div>
                  <Link href={app?.url ?? "/"}>
                    <button
                      disabled={!app?.url}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500 disabled:bg-neutral-500 text-white text-sm md:text-base font-medium"
                    >
                      <ExternalLink className="size-3.5 md:size-4 mr-1" />{" "}
                      Install/Open
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="upload" className="flex flex-col w-full">
            <h1 className="w-full text-center text-xl md:text-2xl font-bold tracking-tight mb-4">
              Upload
            </h1>
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}
