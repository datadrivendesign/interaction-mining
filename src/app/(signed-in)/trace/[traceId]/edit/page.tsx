"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { useMeasure } from "@uidotdev/usehooks";
import { ChevronRight, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ScreenGesture, ScreenRedaction } from "@prisma/client";

import { toast } from "sonner";

import {
  ScreenSchema,
  TraceFormData,
  TraceFormSchema,
} from "./components/types";

import { Button } from "@/components/ui/button";
import Sheet from "./components/sheet";

import RepairScreen from "./components/repair-screen/index";
import RepairDoc from "./components/repair-screen/doc.mdx";
import Review from "./components/review/review";
import ReviewDoc from "./components/review/doc.mdx";
import { useTrace } from "@/lib/hooks";
import { handleSave } from "./util/export";

enum TraceSteps {
  Repair = 0,
  Review = 1,
}

export default function Page() {
  const params = useParams();
  const traceId = params.traceId as string;
  const { trace, isLoading: isTraceLoading } = useTrace(traceId, {
    includes: { app: true, screens: true, task: true },
  });

  const [navRef, { height }] = useMeasure();

  const methods = useForm<TraceFormData>({
    defaultValues: {
      screens: [],
      gestures: {},
      redactions: {},
      description: "",
    },
    resolver: zodResolver(TraceFormSchema),
  });

  useEffect(() => {
    methods.reset({
      screens: trace?.screens,
      gestures: trace?.screens.reduce(
        (acc, screen) => {
          acc[screen.id] = screen.gesture;
          return acc;
        },
        {} as { [key: string]: ScreenGesture }
      ),
      redactions: trace?.screens.reduce(
        (acc, screen) => {
          acc[screen.id] = screen.redactions ?? [];
          return acc;
        },
        {} as { [key: string]: ScreenRedaction[] }
      ),
      vhs: trace?.screens.reduce(
        (acc, screen) => {
          acc[screen.id] = screen.vh ?? {
            x: null,
            y: null,
            width: null,
            height: null,
          };
          return acc;
        },
        {} as { [key: string]: any }
      ),
      description: trace?.description ?? "",
    });
  }, [trace, methods]);

  const [stepIndex, setStepIndex] = useState(0);

  const handleNext = async () => {
    if (stepIndex === TraceSteps.Repair) {
      const validation = ScreenSchema.safeParse(methods.getValues().screens);
      console.log("validation", validation);
      if (!validation.success) {
        const errors = validation.error.issues || "Invalid input";
        errors.forEach((error) => {
          toast.error(error.message);
        });
        return;
      }
    }

    if (stepIndex < TraceSteps.Review) {
      setStepIndex(stepIndex + 1);
    } else {
      // Validate the "description" field
      const validation = TraceFormSchema.safeParse(methods.getValues());
      console.log("validation", validation);
      if (!validation.success) {
        const errors = validation.error.issues || "Invalid input";
        errors.forEach((error) => {
          toast.error(error.message);
        });
        return;
      }
      // Submit the form
      const data = methods.getValues();
      console.log("Submitting data", data);

      handleSave(data, trace!);
    }
  };
  const handlePrevious = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const docRender = () => {
    switch (stepIndex) {
      case 0:
        return <RepairDoc />;
      case 1:
        return <ReviewDoc />;
      default:
        return null;
    }
  };

  const editorRender = () => {
    if (isTraceLoading || !trace) {
      return null;
    } else {
      switch (stepIndex) {
        case 0:
          return <RepairScreen trace={trace} />;
        case 1:
          return <Review />;
        default:
          return null;
      }
    }
  };

  // load values from trace into form
  useEffect(() => {
    if (trace) {
      const screens = trace.screens;
      const gestures = trace.screens.reduce(
        (acc, screen) => {
          if (screen.gesture) {
            acc[screen.id] = screen.gesture;
          }
          return acc;
        },
        {} as { [key: string]: ScreenGesture }
      );

      const redactions = trace.screens.reduce(
        (acc, screen) => {
          acc[screen.id] = screen.redactions ?? [];

          for (const redaction of acc[screen.id]) {
            // replace id field with random id
            // @ts-ignore
            redaction.id = crypto.randomUUID();
          }

          return acc;
        },
        {} as { [key: string]: ScreenRedaction[] }
      );

      const vhs = trace.screens.reduce(
        (acc, screen) => {
          acc[screen.id] = screen.vh ?? {
            x: null,
            y: null,
            width: null,
            height: null,
          };
          return acc;
        },
        {} as { [key: string]: any }
      );

      const description = trace.description ?? "";

      console.log("Resetting form with trace data", {
        screens,
        gestures,
        redactions,
        vhs,
        description,
      });

      methods.reset({
        screens,
        gestures,
        redactions,
        vhs,
        description,
      });
    }
  }, [trace, methods]);

  return (
    <>
      <FormProvider {...methods}>
        <main
          className="relative flex flex-col w-dvw h-[calc(100dvh-65px)] bg-white dark:bg-black overflow-hidden"
          style={{ "--nav-height": `${height}px` } as React.CSSProperties}
        >
          {!isTraceLoading ? (
            <>
              <div className="relative flex w-full h-full">
                <aside className="flex flex-col w-full max-w-sm h-full p-4 md:p-6 overflow-hidden border-r border-neutral-200 dark:border-neutral-800">
                  <article className="prose prose-neutral dark:prose-invert leading-snug">
                    {docRender()}
                  </article>
                </aside>
                <div className="flex flex-col grow h-full items-center">
                  {editorRender()}
                </div>
              </div>
              <nav
                ref={navRef}
                className="sticky bottom-0 flex grow-0 shrink justify-between w-full h-auto px-6 py-4 bg-white dark:bg-black backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex gap-2 items-center">
                  <h1 className="inline-flex items-center text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                    <span className="inline-flex items-center text-muted-foreground">
                      New Trace <ChevronRight className="size-6" />{" "}
                    </span>
                    <span className="inline-flex items-center text-black dark:text-white">
                      {TraceSteps[stepIndex]}
                    </span>
                  </h1>
                  <span className="block">
                    <Sheet title={"Instructions"}>{docRender()}</Sheet>
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={stepIndex === 0}
                  >
                    Back
                  </Button>
                  {stepIndex < TraceSteps.Review ? (
                    <Button onClick={handleNext}>Next</Button>
                  ) : (
                    <Button onClick={handleNext}>Finish</Button>
                  )}
                </div>
              </nav>
            </>
          ) : (
            <div className="flex flex-col grow justify-center items-center w-full h-full">
              <Loader2 className="text-muted-foreground size-8 animate-spin" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                Loading trace...
              </h1>
            </div>
          )}
        </main>
      </FormProvider>
    </>
  );
}
