"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { useMeasure } from "@uidotdev/usehooks";
import { ArrowDownFromLine, ArrowLeftFromLine, ArrowRightFromLine, ArrowUpFromLine, ChevronRight, Circle, CircleDot, CircleHelp, CircleStop, Expand, Grab, IterationCcw, IterationCw, Loader2, Shrink } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCapture } from "@/lib/hooks";
import { ScreenGesture } from "@prisma/client";
import { toast } from "sonner";

import {
  FrameData,
  GestureOption,
  ScreenGestureSchema,
  ScreenSchema,
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
import RedactScreen, { type Redaction } from "./components/redact-screen";
import RedactDoc from "./components/redact-screen/doc.mdx";

import { GestureOptionsContext, handleSave } from "./util";

export type TraceFormData = {
  screens: FrameData[];
  vhs?: { [key: string]: any };
  gestures: { [key: string]: ScreenGesture };
  redactions: { [key: string]: Redaction[] };
  description: string;
};

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

  const gestureOptions = useMemo<GestureOption[]>(() => [
    {
      value: "Tap",
      label: "Tap",
      icon: <Circle className="size-4 text-yellow-800 hover:text-black" />
    },
    {
      value: "Double tap",
      label: "Double tap",
      icon: <CircleDot className="size-4 text-yellow-800 hover:text-black" />
    },
    {
      value: "Touch and hold",
      label: "Touch and hold",
      icon: <CircleStop className="size-4 text-yellow-800 hover:text-black" />
    },
    {
      value: "Swipe",
      label: "Swipe",
      subGestures: [{
        value: "Swipe up",
        label: "Swipe up",
        icon: <ArrowUpFromLine className="size-4 text-yellow-800 hover:text-black" />
      }, {
        value: "Swipe down",
        label: "Swipe down",
        icon: <ArrowDownFromLine className="size-4 text-yellow-800 hover:text-black" />
      }, {
        value: "Swipe left",
        label: "Swipe left",
        icon: <ArrowLeftFromLine className="size-4 text-yellow-800 hover:text-black" />
      }, {
        value: "Swipe right",
        label: "Swipe right",
        icon: <ArrowRightFromLine className="size-4 text-yellow-800 hover:text-black" />
      }]
    },
    {
      value: "Drag",
      label: "Drag",
      icon: <Grab className="size-4 text-yellow-800 hover:text-black" />
    },
    {
      value: "Zoom",
      label: "Zoom",
      subGestures: [{
        value: "Zoom in",
        label: "Zoom in",
        icon: <Shrink className="size-4 text-yellow-800 hover:text-black" />
      }, {
        value: "Zoom out",
        label: "Zoom out",
        icon: <Expand className="size-4 text-yellow-800 hover:text-black" />
      }]
    },
    {
      value: "Rotate",
      label: "Rotate",
      subGestures: [{
        value: "Rotate cw",
        label: "Rotate cw",
        icon: <IterationCw className="size-4 text-yellow-800 hover:text-black" />
      }, {
        value: "Rotate ccw",
        label: "Rotate ccw",
        icon: <IterationCcw className="size-4 text-yellow-800 hover:text-black" />
      }]
    },
    {
      value: "Other",
      label: "Other",
      icon: <CircleHelp className="size-4 text-yellow-800 hover:text-black" />
    }
  ], []);

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

    if (stepIndex < Object.keys(TraceSteps).length - 1) {
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
        return <RepairScreen />;
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
          className="relative flex flex-col w-dvw h-dvh bg-white dark:bg-black"
          style={{ "--nav-height": `${height}px` } as React.CSSProperties}
        >
          {!isTraceLoading ? (
            <>
              <div className="relative flex w-full h-full overflow-hidden">
                {/* <aside className="sticky top-0 left-0 hidden lg:flex flex-col grow w-full p-6 max-w-sm border-r border-neutral-200 dark:border-neutral-800 overflow-auto">
                  <h1 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50 mb-4">
                    Instructions
                  </h1>
                  <article className="prose prose-neutral dark:prose-invert leading-snug">
                    {docRender()}
                  </article>
                </aside> */}
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
