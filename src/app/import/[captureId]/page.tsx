"use client";
import { useEffect, useReducer, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import Sheet from "./components/sheet";

import SelectScreenDoc from "./components/select-screen.mdx";
import SelectScreen, { SelectScreenItem } from "./components/select-screen";
import RedactScreen, { RedactScreenItem } from "./components/repair-screen";
import RedactPersonalDataDoc from "./components/redact-personal-data.mdx";
import RepairInteractionsDoc from "./components/repair-interactions.mdx";

import { getTrace } from "@/lib/actions/trace";
import { TraceWithAppsScreens as Trace } from "@/lib/actions/trace";
import { Screen } from "@prisma/client";
import { useParams } from "next/navigation";

const container = {
  enter: {
    width: "0",
  },
  show: {
    width: "auto",
  },
  exit: {
    width: "0",
  },
} as Variants;

const item = {
  enter: {
    opacity: 0,
    filter: "blur(10px)"
  },
  show: {
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    filter: "blur(10px)",
  },
} as Variants;

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
  {
    title: "Redaction",
    description: "Redact personal data from the trace.",
    content: <RedactPersonalDataDoc />,
  },
  {
    title: "Review",
    description: "Review the trace and finish the trace creation process.",
    content: <SelectScreenDoc />,
  }
]


function stepReducer(state: any, action: number) {
  if (action !== state.index) {
    return {
      index: action,
      hash: Date.now() + Math.random(),
    };
  } else {
    return state;
  }
}

export default function Page() {
  const params = useParams();
  const captureId = params.captureId as string;

  const [capture, setCapture] = useState<Trace>({} as Trace);
  const [stepState, setStepState] = useReducer(stepReducer, {
    index: 0,
    hash: Date.now() + Math.random(),
  });

  const nextStep = () => {
    if (stepState.index < traceSteps.length - 1) {
      setStepState(stepState.index + 1);
    }
  }

  const prevStep = () => {
    if (stepState.index > 0) {
      setStepState(stepState.index - 1);
    }
  }

  // >>> DUMMY DRIVER CODE

  async function getCaptureSession(captureId: string) {
    const trace = await getTrace(captureId);
    if (trace) {
      console.log(trace);
      return trace;
    }
  }

  useEffect(() => {
    getCaptureSession(captureId).then((capture) => {
      if (capture) {
        setCapture(capture);
      }
    });
  }, []);

  // <<< DUMMY DRIVER CODE

  return (
    <>
      <main className="relative flex flex-col min-w-screen min-h-screen">
        <div className="relative flex grow w-full gap-4">
          <aside className="sticky top-0 left-0 hidden lg:flex flex-col shrink w-full h-full p-8 pr-0 max-w-xs">
            <article className="prose prose-neutral dark:prose-invert leading-snug">
              {traceSteps[stepState.index].content}
            </article>
          </aside>
          <div className="flex flex-col grow w-full p-8 justify-center items-center over">
            {
              stepState.index === 0 ? (
                <SelectScreen className="grid-cols-3 md:grid-cols-4 lg:grid-cols-5 grow w-full">
                  {
                    capture.screens?.map((screen: Screen, index) => (
                      <SelectScreenItem key={index}>
                        <div className="relative w-full h-full bg-neutral-900">
                          <Image
                            src={screen.src}
                            alt="gallery"
                            draggable={false}
                            className="z-0 object-cover w-full h-auto"
                            width={0}
                            height={0}
                            sizes="100vw"
                          />
                        </div>
                      </SelectScreenItem>
                    ))
                  }

                </SelectScreen>
              ) : null
            }
            {
              stepState.index === 1 ? (
                <RedactScreen className="grid-cols-3 md:grid-cols-4 lg:grid-cols-5 grow w-full">
                  {
                    capture.screens?.map((screen: Screen, index) => (
                      <RedactScreenItem key={index} isBroken={screen.gesture === null}>
                        <div className="w-full h-full bg-neutral-900">
                          <Image
                            src={screen.src}
                            alt="gallery"
                            className="z-0 object-cover w-full h-auto"
                            width={0}
                            height={0}
                            sizes="100vw"
                          /></div>
                      </RedactScreenItem>
                    ))
                  }

                </RedactScreen>
              ) : null
            }
          </div>
        </div>
        <nav
          className="sticky bottom-0 flex grow-0 shrink justify-between w-full px-8 py-4 bg-white/50 dark:bg-neutral-950/50 backdrop-blur"
        >
          <div className="flex gap-2 items-center">
            <h1
              className="inline-flex items-center text-lg font-semibold text-neutral-950 dark:text-neutral-50"
            >
              <span className="inline-flex items-center text-neutral-400 dark:text-neutral-500">
                New Trace <ChevronRight className="size-6" />
              </span>
              <AnimatePresence mode="sync">
                <motion.div
                  key={stepState.hash}
                  variants={container}
                  initial="enter"
                  animate="show"
                  exit="exit"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.5
                  }}
                >
                  <motion.span
                    key={stepState.hash}
                    className="inline-block text-neutral-950 dark:text-neutral-50"
                    variants={item}
                    initial="enter"
                    animate="show"
                    exit="exit"
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 10,
                      mass: 0.75,
                    }}
                    layoutId="title"
                    layoutRoot
                  >
                    {traceSteps[stepState.index].title}
                  </motion.span>
                </motion.div>
              </AnimatePresence>
            </h1>
            <span className="block lg:hidden">
              <Sheet
                title={"Trace Creation Help"}
                description={traceSteps[stepState.index].description}
              >
                {traceSteps[stepState.index].content}
              </Sheet>
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={prevStep} disabled={stepState.index === 0}>Back</Button>
            <Button onClick={nextStep} disabled={stepState.index === (traceSteps.length - 1)}>Next</Button></div>
        </nav>
      </main>
    </>
  );
}
