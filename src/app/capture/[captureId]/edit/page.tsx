"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { useMeasure } from "@uidotdev/usehooks";
import { ChevronRight, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCapture } from "@/lib/hooks";
import { ScreenGesture } from "@prisma/client";
import {
  ScreenGestureSchema,
  ScreenSchema,
  TraceFormSchema,
} from "./components/types";

import { Button } from "@/components/ui/button";
import Sheet from "./components/sheet";

import ExtractFrames, { type FrameData } from "./components/extract-frames";
import ExtractFrameDoc from "./components/extract-frames/doc.mdx";
import RepairScreen from "./components/repair-screen/index";
import RepairInteractionsDoc from "./components/repair-screen/doc.mdx";
import Review from "./components/review/review";
import ReviewDoc from "./components/review/doc.mdx";
import { toast } from "sonner";
import { handleSave } from "./util";

const traceSteps = [
  {
    title: "Selection",
    description: "Select the screens you want to use to create a new trace.",
    content: <ExtractFrameDoc />,
  },
  {
    title: "Repair",
    description: "Repair interactions that are broken or missing.",
    content: <RepairInteractionsDoc />,
  },
  {
    title: "Review",
    description: "Review the trace and finish the trace creation process.",
    content: <ReviewDoc />,
  },
];

export type TraceFormData = {
  screens: FrameData[];
  gestures: { [key: string]: ScreenGesture };
  description: string;
};

export default function Page() {
  const params = useParams();
  const captureId = params.captureId as string;
  const { capture, isLoading: isTraceLoading } = useCapture(captureId);

  const [navRef, { height }] = useMeasure();

  const methods = useForm<TraceFormData>({
    defaultValues: {
      screens: [],
      gestures: {},
      description: "",
    },
    resolver: zodResolver(TraceFormSchema),
  });

  const [stepIndex, setStepIndex] = useState(0);

  const handleNext = async () => {
    if (stepIndex === 0) {
      // Validate the "screens")
      const validation = ScreenSchema.safeParse(methods.getValues().screens);
      if (!validation.success) {
        const errors = validation.error.issues || "Invalid input";
        errors.forEach((error) => {
          toast.error(error.message);
        });
        return;
      }
    } else if (stepIndex === 1) {
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
    } else if (stepIndex === 2) {
      // Validate the "description" field
      const validation = TraceFormSchema.safeParse(methods.getValues());
      if (!validation.success) {
        const errors = validation.error.issues || "Invalid input";
        errors.forEach((error) => {
          toast.error(error.message);
        });
        return;
      }
    }

    if (stepIndex < traceSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      // Submit the form
      const data = methods.getValues();
      handleSave(data, capture!);
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
        return <RepairInteractionsDoc />;
      case 2:
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
        return <RepairScreen />;
      case 2:
        return <Review />;
      default:
        return null;
    }
  };

  return (
    <>
      <FormProvider {...methods}>
        <main
          className="relative flex flex-col w-dvw h-dvh bg-white dark:bg-black"
          style={{ "--nav-height": `${height}px` } as React.CSSProperties}
        >
          {!isTraceLoading ? (
            <>
              <div className="relative flex w-full h-full overflow-hidden">
                <aside className="sticky top-0 left-0 hidden lg:flex flex-col grow w-full p-6 max-w-sm border-r border-neutral-200 dark:border-neutral-800 overflow-auto">
                  <h1 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50 mb-4">
                    Instructions
                  </h1>
                  <article className="prose prose-neutral dark:prose-invert leading-snug">
                    {docRender()}
                  </article>
                </aside>
                <div className="flex flex-col grow w-full justify-center items-center">
                  {editorRender()}
                </div>
              </div>
              <nav
                ref={navRef}
                className="sticky bottom-0 flex grow-0 shrink justify-between w-full h-auto px-6 py-4 bg-white dark:bg-black backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800"
              >
                <div className="flex gap-2 items-center">
                  <h1 className="inline-flex items-center text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                    <span className="inline-flex items-center text-neutral-500 dark:text-neutral-400">
                      New Trace <ChevronRight className="size-6" />{" "}
                    </span>
                    <span className="inline-flex items-center text-black dark:text-white">
                      {traceSteps[stepIndex].title}
                    </span>
                  </h1>
                  <span className="block lg:hidden">
                    <Sheet
                      title={"Instructions"}
                      description={traceSteps[stepIndex].description}
                    >
                      {traceSteps[stepIndex].content}
                    </Sheet>
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
                  {stepIndex < traceSteps.length - 1 ? (
                    <Button onClick={handleNext}>Next</Button>
                  ) : (
                    <Button onClick={handleNext}>Finish</Button>
                  )}
                </div>
              </nav>
            </>
          ) : (
            <div className="flex flex-col grow justify-center items-center w-full h-full">
              <Loader2 className="text-neutral-500 dark:text-neutral-400 size-8 animate-spin" />
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
