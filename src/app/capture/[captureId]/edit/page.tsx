"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { useMeasure } from "@uidotdev/usehooks";
import { ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import Sheet from "./components/sheet";

import ExtractFrames, { FrameData } from "./components/extract-frames";
import RepairScreen from "./components/repair-screen/index";
import Review from "./components/review/review";

import ExtractFrameDoc from "./components/extract-frames/doc.mdx";
import RepairInteractionsDoc from "./components/repair-screen/doc.mdx";
import ReviewDoc from "./components/review/doc.mdx";

import { useCapture } from "@/lib/hooks";
import { Screen, ScreenGesture } from "@prisma/client";
import { toast } from "sonner";
import {
  createScreen,
  createTrace,
  generatePresignedScreenUpload,
} from "@/lib/actions";

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

export type CaptureFormData = {
  screens: FrameData[];
  gestures: { [key: string]: ScreenGesture };
  redactions: { [key: string]: string };
  description: string;
};

export default function Page() {
  const params = useParams();
  const captureId = params.captureId as string;
  const [navRef, { height }] = useMeasure();

  const { capture, isLoading: isTraceLoading } = useCapture(captureId);

  const methods = useForm<CaptureFormData>({
    defaultValues: {
      screens: [],
      gestures: {},
      redactions: {},
      description: "",
    },
  });

  const [stepIndex, setStepIndex] = useState(0);

  const handleNext = async () => {
    let isValid = false;

    if (stepIndex === 0) {
      // Validate "screens" field
      isValid = await methods.trigger("screens");
      const screens = methods.getValues("screens");
      if (!screens || screens.length === 0) {
        methods.setError("screens", { message: "No screens were selected." });
        toast.error("No screens were selected.");
        isValid = false;
      }
    } else if (stepIndex === 1) {
      // Custom validation for gestures
      const screens = methods.getValues("screens");
      const gestures = methods.getValues("gestures");
      const missingGesture = screens.some(
        (screen) => !gestures[screen.id] || gestures[screen.id].type === null
      );
      if (missingGesture) {
        methods.setError("gestures", {
          message: "Please add a gesture to all screens.",
        });
        toast.error("Please add a gesture to all screens.");
        isValid = false;
      } else {
        isValid = true;
      }
    } else if (stepIndex === 2) {
      // Validate "description" field
      isValid = await methods.trigger("description");
      const description = methods.getValues("description");
      if (!description) {
        methods.setError("description", {
          message: "Please add a description to your trace.",
        });
        toast.error("Please add a description to your trace.");
        isValid = false;
      }
    }

    if (isValid && stepIndex < traceSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else if (isValid && stepIndex === traceSteps.length - 1) {
      const data = methods.getValues();
      await onSubmit(data);
    }
  };

  const handlePrevious = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const onSubmit = async (data: CaptureFormData) => {
    console.log("Serializing and submitting...", data);

    // Transpose gestures on to screens
    let screens = data.screens.map((screen) => {
      return {
        created: new Date(),
        gesture: data.gestures[screen.id],
        src: "",
        vh: "",
      };
    }) as Screen[];

    // Upload B64 images to S3 using presigned uploads
    const generateScreenUploadRes = await Promise.all(
      screens.map((_) => {
        return generatePresignedScreenUpload(captureId, "image/png");
      })
    );

    if (
      !generateScreenUploadRes ||
      generateScreenUploadRes.some((res) => !res.ok)
    ) {
      toast.error(
        "Failed to upload screen images: Failed to generate presigned URLs."
      );
      return;
    }

    const screenUploadRes = await Promise.all(
      data.screens.map(async (screen, index) => {
        var res;

        if (generateScreenUploadRes[index].ok) {
          console.log(screen.url.split("data:image/png;base64,")[1]);
          res = await fetch(generateScreenUploadRes[index].data.uploadUrl, {
            method: "PUT",
            body: Buffer.from(
              screen.url.split("data:image/png;base64,")[1],
              "base64"
            ),
            headers: { "Content-Type": "image/png" },
          });

          if (!res.ok) {
            toast.error("Failed to upload screen images.");
            return { ok: false, message: "Failed to upload screen images." };
          }

          // Set screen src to S3 URL
          screens[index].src = generateScreenUploadRes[index].data.fileUrl;

          return generateScreenUploadRes[index];
        }
      })
    );

    if (!screenUploadRes || screenUploadRes.some((res) => !res!.ok)) {
      toast.error("Failed to upload screen images.");
      return;
    }

    console.log(screens);

    // Create trace AND screen records
    const trace = await createTrace(
      {
        name: "New Trace",
        description: data.description,
        created: new Date(),
        appId: capture!.appId_!,
        screens: {
          create: [...screens],
        },
        worker: "web",
      },
      {
        includes: { screens: true },
      }
    );

    if (!trace.ok) {
      toast.error("Failed to create trace.");
      return;
    }

    toast.success("Trace created successfully.");
  };

  const renderStep = () => {
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
          className="relative flex flex-col min-w-dvw min-h-dvh bg-white dark:bg-black"
          style={{ "--nav-height": `${height}px` } as React.CSSProperties}
        >
          {!isTraceLoading ? (
            <>
              <div className="relative flex grow w-full gap-4">
                <aside className="sticky top-0 left-0 hidden lg:flex flex-col shrink w-full h-full p-8 pr-0 max-w-xs">
                  <article className="prose prose-neutral dark:prose-invert leading-snug">
                    {traceSteps[stepIndex].content}
                  </article>
                </aside>
                <div className="flex flex-col grow w-full justify-center items-center">
                  {renderStep()}
                </div>
              </div>
              <nav
                ref={navRef}
                className="sticky bottom-0 flex grow-0 shrink justify-between w-full px-8 py-4 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-sm"
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
                      title={"Trace Creation Help"}
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
