"use client";
import { useEffect, useReducer, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMeasure } from "@uidotdev/usehooks";
import { ChevronRight, Loader2 } from "lucide-react";

import { getTrace } from "@/lib/actions/trace";
import { Button } from "@/components/ui/button";

import { FormContext } from "./components/controller";
import Sheet from "./components/sheet";
import SelectScreen from "./components/select-screen";
import RepairScreen from "./components/repair-screen";
// import RedactScreen from "./components/redact-screen";
import SelectScreenDoc from "./components/select-screen.mdx";
import RepairInteractionsDoc from "./components/repair-interactions.mdx";
// import RedactPersonalDataDoc from "./components/redact-personal-data.mdx";

import { loadingReducer, container, item } from "./util";
import { Screen, ScreenGesture } from "@prisma/client";

const traceSteps = [
  {
    title: "Selection",
    description: "Select the screens you want to use to create a new trace.",
    content: <SelectScreenDoc />,
  },
  {
    title: "Repair",
    description: "Repair interactions that are broken or missing.",
    content: <RepairInteractionsDoc />,
  },
  // {
  //   title: "Redaction",
  //   description: "Redact personal data from the trace.",
  //   content: <RedactPersonalDataDoc />,
  // },
  // {
  //   title: "Review",
  //   description: "Review the trace and finish the trace creation process.",
  //   content: <SelectScreenDoc />,
  // },
];

type FormData = {
  screens: Screen[];
  gestures: { [key: string]: ScreenGesture };
  redactions: { [key: string]: string };
}

export default function Page() {
  const params = useParams();
  const traceId = params.traceId as string;

  const { } = useForm();

  const [navRef, { height }] = useMeasure();

  const [loading, setLoading] = useReducer(loadingReducer, {
    isLoaded: false,
    message: "Getting your capture session...",
  });

  const [capture, setCapture] = useState({});

  // Form state
  const [formScreens, setFormScreens] = useState<Screen[]>([]);
  const [formEdits, setFormEdits] = useState({
    gestures: {} as { [key: string]: ScreenGesture },
    redactions: {},
  });

  const [stepIndex, setStepIndex] = useState(0);

  const handleNext = () => {
    if (stepIndex < traceSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  // >>> DUMMY DRIVER CODE
  async function fetchTrace(traceId: string) {
    const trace = await getTrace(traceId, {
      includes: { screens: true, app: false },
    });

    if (trace.ok) {
      return trace.data;
    }
  }

  // Data fetching
  useEffect(() => {
    fetchTrace(traceId).then((capture) => {
      if (capture) {
        setCapture(capture);
        setFormScreens(capture.screens);
        setLoading({ type: "SET_LOADED", payload: true });
      }
    });
  }, [traceId]);
  // <<< DUMMY DRIVER CODE

  // Apply edits
  useEffect(() => {
    // Apply gestures
    formScreens.forEach((screen) => {
      const gesture = formEdits.gestures[screen.id] as ScreenGesture;

      if (gesture) {
        // Apply gesture
        setFormScreens((prev) =>
          prev.map((s) => {
            if (s.id === screen.id) {
              return {
                ...s,
                gesture: gesture,
              };
            }

            return s;
          })
        );
      }
    });
  }, [formEdits]);

  useEffect(() => {
    console.log(formEdits);
  }, [formEdits]);

  return (
    <>
      <FormContext.Provider
        value={{
          screens: formScreens,
          edits: formEdits,
          setScreens: setFormScreens,
          setEdits: setFormEdits,
        }}
      >
        <main
          className="relative flex flex-col min-w-dvw min-h-dvh bg-white dark:bg-black"
          style={{ "--nav-height": `${height}px` } as React.CSSProperties}
        >
          {loading.isLoaded ? (
            <>
              <div className="relative flex grow w-full gap-4">
                <aside className="sticky top-0 left-0 hidden lg:flex flex-col shrink w-full h-full p-8 pr-0 max-w-xs">
                  <article className="prose prose-neutral dark:prose-invert leading-snug">
                    {traceSteps[stepIndex].content}
                  </article>
                </aside>
                <div className="flex flex-col grow w-full justify-center items-center">
                  {stepIndex === 0 ? (
                    <SelectScreen screens={formScreens} />
                  ) : null}
                  {stepIndex === 1 ? (
                    <RepairScreen screens={formScreens} />
                  ) : null}
                  {/* {stepState.index === 2 ? <RedactScreen data={capture} /> : null} */}
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
                    <Button>Finish</Button>
                  )}
                </div>
              </nav>
            </>
          ) : (
            <div className="flex flex-col grow justify-center items-center w-full h-full">
              <Loader2 className="text-neutral-500 dark:text-neutral-400 size-8 animate-spin" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                {loading.message}
              </h1>
            </div>
          )}
        </main>
      </FormContext.Provider>
    </>
  );
}
