"use client";

import SetUpInstructions from "./components/mdx/set-up-instructions.mdx";
import DeployInstance from "./components/mdx/deploy-instance.mdx";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import RecordTrace from "./components/record-trace";

export default function Page() {
  return (
    <>
      <main className="relative flex flex-col grow min-h-dvh items-center justify-between">
        <Tabs defaultValue="setup-instructions" className="w-full max-w-(--breakpoint-xl) p-4">
          <TabsList className="sticky left-10">
            <TabsTrigger value="setup-instructions">
              Setup Instructions
            </TabsTrigger>
            <TabsTrigger value="record-trace">
              Recording a Trace
            </TabsTrigger>
            <TabsTrigger value="deploy-instance">
              Deploy Own Instance
            </TabsTrigger>
          </TabsList>
          <TabsContent value="setup-instructions">
            <section className="relative flex flex-col md:flex-row w-full max-w-(--breakpoint-xl) p-4 md:p-8 gap-8 md:gap-16">
              <article className="w-full prose prose-neutral dark:prose-invert leading-snug">
                <SetUpInstructions />
              </article>
            </section>
          </TabsContent>
          <TabsContent value="record-trace">
            <RecordTrace />
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
    </>
  );
}
