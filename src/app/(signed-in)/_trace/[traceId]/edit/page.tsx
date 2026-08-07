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
    const loadFormData = async () => {
      const screens = trace?.screens;
      const gestures = trace?.screens.reduce(
        (acc, screen) => {
          acc[screen.id] = screen.gesture;
          return acc;
        },
        {} as { [key: string]: ScreenGesture },
      );
      const redactions = trace?.screens.reduce(
        (acc, screen) => {
          acc[screen.id] = screen.redactions ?? [];
          return acc;
        },
        {} as { [key: string]: ScreenRedaction[] },
      );
      // need to fetch and deserialize JSON file from s3
      const vhs = await Promise.all(
        (trace?.screens ?? []).map(async (screen) => {
          try {
            if (screen.vh && typeof screen.vh === "string") {
              const res = await fetch(screen.vh);
              const data = await res.json();
              return [screen.id, data];
            }
          } catch (err) {
            console.error(`Failed to fetch VH for screen ${screen.id}`, err);
          }
          return [screen.id, { x: null, y: null, width: null, height: null }];
        }),
      ).then(Object.fromEntries);
      const description = trace?.description ?? "";

      methods.reset({
        screens,
        gestures,
        redactions,
        vhs,
        description,
      });
    };

    loadFormData();
  }, [trace, methods]);

  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleNext = async () => {
    if (stepIndex === TraceSteps.Repair) {
      const validation = ScreenSchema.safeParse(methods.getValues().screens);
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
      setIsSubmitting(true);
      // Validate the "description" field
      const validation = TraceFormSchema.safeParse(methods.getValues());
      if (!validation.success) {
        const errors = validation.error.issues || "Invalid input";
        errors.forEach((error) => {
          toast.error(error.message);
        });
        return;
      }
      // Submit the form
      const data = methods.getValues();
      console.log("Submitting data");
      handleSave(data, trace!).finally(() => {
        setIsSubmitting(false);
      });
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
    const loadFormData = async () => {
      if (!trace) {
        return;
      }
      const screens = trace.screens;
      const gestures = trace.screens.reduce(
        (acc, screen) => {
          if (screen.gesture) {
            acc[screen.id] = screen.gesture;
          }
          return acc;
        },
        {} as { [key: string]: ScreenGesture },
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
        {} as { [key: string]: ScreenRedaction[] },
      );
      // have to fetch from vh URL
      const vhs = await Promise.all(
        (trace?.screens ?? []).map(async (screen) => {
          try {
            if (screen.vh && typeof screen.vh === "string") {
              const res = await fetch(screen.vh);
              const data = await res.json();
              return [screen.id, data];
            }
          } catch (err) {
            console.error(`Failed to fetch VH for screen ${screen.id}`, err);
          }
          return [screen.id, { x: null, y: null, width: null, height: null }];
        }),
      ).then(Object.fromEntries);
      const description = trace.description ?? "";

      console.log("Resetting form with trace data");

      methods.reset({
        screens,
        gestures,
        redactions,
        vhs,
        description,
      });
    };

    loadFormData();
  }, [trace, methods]);

  return (
    <>
      <FormProvider {...methods}>
        <main
          className="relative flex h-[calc(100dvh-65px)] w-dvw flex-col overflow-hidden bg-white dark:bg-black"
          style={{ "--nav-height": `${height}px` } as React.CSSProperties}
        >
          {!isTraceLoading ? (
            <>
              <div className="relative flex h-full w-full">
                <aside className="flex h-full w-full max-w-sm flex-col overflow-hidden border-r border-neutral-200 p-4 md:p-6 dark:border-neutral-800">
                  <article className="prose leading-snug prose-neutral dark:prose-invert">
                    {docRender()}
                  </article>
                </aside>
                <div className="flex h-full grow flex-col items-center">
                  {editorRender()}
                </div>
              </div>
              <nav
                ref={navRef}
                className="sticky bottom-0 flex h-auto w-full shrink grow-0 justify-between border-t border-neutral-200 bg-white px-6 py-4 backdrop-blur-sm dark:border-neutral-800 dark:bg-black"
              >
                <div className="flex items-center gap-2">
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
                    <Button onClick={handleNext} disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Finish
                    </Button>
                  )}
                </div>
              </nav>
            </>
          ) : (
            <div className="flex h-full w-full grow flex-col items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                Loading trace...
              </h1>
            </div>
          )}
        </main>
      </FormProvider>
    </>
  );
}
