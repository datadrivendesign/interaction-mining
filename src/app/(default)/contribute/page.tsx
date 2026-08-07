"use client";

import GettingStarted from "./components/mdx/getting-started.mdx";
import SetUpInstructions from "./components/mdx/set-up-instructions.mdx";
import DeployInstance from "./components/mdx/deploy-instance.mdx";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import RecordTrace from "./components/record-trace";

export default function Page() {
  return (
    <main className="relative flex min-h-dvh grow flex-col items-center justify-between">
      <section className="relative flex w-full max-w-(--breakpoint-xl) flex-col gap-8 p-4 md:flex-row md:gap-16 md:p-8">
        <article className="prose w-full leading-snug prose-neutral dark:prose-invert">
          <GettingStarted />
        </article>
      </section>
      <Tabs
        defaultValue="record-trace"
        className="w-full max-w-(--breakpoint-xl) p-4"
      >
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
          <section className="relative flex w-full max-w-(--breakpoint-xl) flex-col gap-8 p-4 md:flex-row md:gap-16 md:p-8">
            <article className="prose w-full leading-snug prose-neutral dark:prose-invert">
              <SetUpInstructions />
            </article>
          </section>
        </TabsContent>
        <TabsContent value="deploy-instance">
          <section className="relative flex w-full max-w-(--breakpoint-xl) flex-col gap-8 p-4 md:flex-row md:gap-16 md:p-8">
            <article className="prose w-full leading-snug prose-neutral dark:prose-invert">
              <DeployInstance />
            </article>
          </section>
        </TabsContent>
      </Tabs>
    </main>
  );
}
