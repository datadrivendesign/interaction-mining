"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { useMeasure } from "@uidotdev/usehooks";
import { ChevronRight, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Prisma, ScreenGesture, ScreenRedaction } from "@prisma/client";

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

import RepairScreen from "./components/repair-screen/index";
import RepairDoc from "./components/repair-screen/doc.mdx";
import Review from "./components/review/review";
import ReviewDoc from "./components/review/doc.mdx";
import RedactScreen from "./components/redact-screen";
import RedactDoc from "./components/redact-screen/doc.mdx";
import { useTrace } from "@/lib/hooks";

enum TraceSteps {
  Extract = 0,
  Repair = 1,
  Redact = 2,
  Review = 3,
}

export default function Page() {
  const params = useParams();
  const traceId = params.traceId as string;
  const {
    trace,
    isLoading: isTraceLoading,
  }: {
    trace: Prisma.TraceGetPayload<{
      include: {
        app: true;
        screens: true;
        task: true;
      };
    }>;
    isLoading: boolean;
  } = useTrace(traceId, {
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
      redactions: {},
    });
  }, [trace, methods]);

  // Function to perform step-level validation
  const validateStep = async (): Promise<boolean> => {
    const data = methods.getValues();
    // Example validation: Ensure at least one screen exists and, for Step 2, each screen has a gesture
    if (stepIndex === 0) {
      if (!data.screens || data.screens.length === 0) {
        alert("No screens were generated.");
        return false;
      }
    }
    if (stepIndex === 1) {
      const missingGesture = data.screens.some((screen) => !screen.gesture);
      if (missingGesture) {
        alert("Please add a gesture to all screens.");
        return false;
      }
    }
    return true;
  };

  const onSubmit = (data: FormData) => {
    // Here you can assemble and transform the data as needed before sending it to your backend.
    console.log("Final backend-ready data:", data);
  };

  // // Form state
  // const [formScreens, setFormScreens] = useState<Screen[]>([]);
  // const [formEdits, setFormEdits] = useState({
  //   gestures: {} as { [key: string]: ScreenGesture },
  //   redactions: {},
  // });

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
      console.log("Submitting data", data);

      // handleSave(data, capture!)
      //   .then(() => {
      //     router.push(`/app/${capture!.appId_!}`);
      //   })
      //   .catch((reason: string) => {
      //     console.error(reason);
      //   });
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
        return <RedactDoc />;
      case 2:
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
          return <RedactScreen />;
        case 2:
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

      methods.reset({
        screens,
        gestures,
        redactions,
        vhs,
        description,
      });
    }
  }, [trace, methods]);

  useEffect(() => {
    console.log("Form values changed:", methods.getValues());
  }, [methods.watch()]);

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
