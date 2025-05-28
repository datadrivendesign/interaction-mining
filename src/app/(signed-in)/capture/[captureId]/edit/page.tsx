"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { useMeasure } from "@uidotdev/usehooks";
import { ChevronRight, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCapture } from "@/lib/hooks";
import { toast } from "sonner";

import {
  RedactionSchema,
  ScreenGestureSchema,
  ScreenSchema,
  TraceFormData,
  TraceFormSchema,
} from "./components/types";

import { Button } from "@/components/ui/button";
import Sheet from "./components/sheet";

import ExtractFrames from "./components/extract-frames/extract-frames";
import ExtractFrameDoc from "./components/extract-frames/doc.mdx";
import RepairScreen from "./components/repair-screen/index";
import RepairDoc from "./components/repair-screen/doc.mdx";
import Review from "./components/review/review";
import ReviewDoc from "./components/review/doc.mdx";
import RedactScreen from "./components/redact-screen";
import RedactDoc from "./components/redact-screen/doc.mdx";

import { handleSave } from "./util";

enum TraceSteps {
  Extract = 0,
  Repair = 1,
  Redact = 2,
  Review = 3,
}

export default function Page() {
  const params = useParams();
  const captureId = params.captureId as string;
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });

  const [navRef, { height }] = useMeasure();
  const router = useRouter();

  const methods = useForm<TraceFormData>({
    defaultValues: {
      screens: [],
      vhs: {},
      gestures: {},
      redactions: {},
      description: "",
    },
    resolver: zodResolver(TraceFormSchema),
  });

  const [stepIndex, setStepIndex] = useState(0);

  const handleNext = async () => {
    if (stepIndex === TraceSteps.Extract) {
      // Validate the "screens")
      const validation = ScreenSchema.safeParse(methods.getValues().screens);
      if (!validation.success) {
        const errors = validation.error.issues || "Invalid input";
        errors.forEach((error) => {
          toast.error(error.message);
        });
        return;
      }
    } else if (stepIndex === TraceSteps.Repair) {
      // Validate the "gestures"
      const validation = ScreenGestureSchema.safeParse(methods.getValues());
      if (!validation.success) {
        console.log(validation.error.issues);
        const errors = validation.error.issues || "Invalid input";
        errors.forEach((error) => {
          toast.error(error.message);
        });
        return;
      }
    } else if (stepIndex === TraceSteps.Redact) {
      // Validate the "redactions"
      const validation = RedactionSchema.safeParse(
        methods.getValues().redactions
      );
      if (!validation.success) {
        console.log(validation.error.issues);
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
      if (!validation.success) {
        const errors = validation.error.issues || "Invalid input";
        errors.forEach((error) => {
          toast.error(error.message);
        });
        return;
      }
      // Submit the form
      const data = methods.getValues();

      handleSave(data, capture!)
        .then(() => {
          router.push(`/app/${capture!.appId!}`);
        })
        .catch((reason: string) => {
          console.error(reason);
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
        return <ExtractFrameDoc />;
      case 1:
        return <RepairDoc />;
      case 2:
        return <RedactDoc />;
      case 3:
        return <ReviewDoc />;
      default:
        return null;
    }
  };

  const editorRender = () => {
    switch (stepIndex) {
      case 0:
        return <ExtractFrames capture={capture} />;
      case 1:
        return <RepairScreen capture={capture} />;
      case 2:
        return <RedactScreen />;
      case 3:
        return <Review />;
      default:
        return null;
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <main
          className="relative flex flex-col w-dvw h-[calc(100dvh-65px)] bg-white dark:bg-black overflow-hidden"
          style={{ "--nav-height": `${height}px` } as React.CSSProperties}
        >
          {!isTraceLoading ? (
            <>
              <div className="relative flex w-full h-[calc(100%-var(--nav-height))]">
                {/* <aside className="hidden md:flex flex-col w-full max-w-xs h-full border-r border-neutral-200 dark:border-neutral-800">
                  <article className="prose prose-neutral dark:prose-invert leading-snug p-4 md:p-6 overflow-auto">
                    {docRender()}
                  </article>
                </aside> */}
                <div className="flex flex-col w-full h-full items-center">
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
                Loading capture...
              </h1>
            </div>
          )}
        </main>
      </FormProvider>
    </>
  );
}
