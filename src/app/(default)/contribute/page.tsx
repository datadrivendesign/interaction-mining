"use client";

import GettingStarted from "./components/mdx/getting-started.mdx";
import SetUpInstructions from "./components/mdx/set-up-instructions.mdx";
import DeployInstance from "./components/mdx/deploy-instance.mdx";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import RecordTrace from "./components/record-trace";

export default function Page() {
  return (
    <main className="relative flex flex-col grow min-h-dvh items-center justify-between">
      <section className="relative flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) p-4 md:p-8 gap-8 md:gap-16">
        <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
          <GettingStarted />
        </article>
      </section>
      <Tabs defaultValue="record-trace" className="w-full max-w-(--breakpoint-xl) p-4">
        <TabsList className="sticky left-10">
          <TabsTrigger value="record-trace">
            Create a Mobile Task Flow
          </TabsTrigger>
          <TabsTrigger value="setup-instructions">
            Set Up Your Own Local Instance
          </TabsTrigger>
          <TabsTrigger value="deploy-instance">
            Deploy Your Own Instance
          </TabsTrigger>
        </TabsList>
        <TabsContent value="record-trace">
          <RecordTrace />
        </TabsContent>
        <TabsContent value="setup-instructions">
          <section className="relative flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) p-4 md:p-8 gap-8 md:gap-16">
            <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
              <SetUpInstructions />
            </article>
          </section>
        </TabsContent>
        <TabsContent value="deploy-instance">
          <section className="relative flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) p-4 md:p-8 gap-8 md:gap-16">
            <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
              <DeployInstance />
            </article>
          </section>
        </TabsContent>
      </Tabs>
    </main>
  );
}
