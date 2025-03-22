"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { ChevronRight, Loader2 } from "lucide-react";
import { useMeasure } from "@uidotdev/usehooks";

import { getTrace } from "@/lib/actions/trace";
import { Button } from "@/components/ui/button";

import Sheet from "./components/sheet";
import SelectScreen from "./components/select-screen";
import RepairScreen from "./components/repair-screen";
import RedactScreen from "./components/redact-screen";
import SelectScreenDoc from "./components/select-screen.mdx";
import RedactPersonalDataDoc from "./components/redact-personal-data.mdx";
import RepairInteractionsDoc from "./components/repair-interactions.mdx";

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
    filter: "blur-sm(10px)",
  },
  show: {
    opacity: 1,
    filter: "blur-sm(0px)",
  },
  exit: {
    opacity: 0,
    filter: "blur-sm(10px)",
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
  },
];

const stepReducer = (state: any, action: number) => {
  if (action !== state.index) {
    return {
      index: action,
      hash: Date.now() + Math.random(),
    };
  }

  return state;
};

const loadingReducer = (
  state: any,
  action: {
    type: "SET_LOADED" | "SET_MESSAGE";
    payload?: any;
  }
) => {
  if (action.type === "SET_LOADED" && action.payload) {
    return {
      ...state,
      isLoaded: action.payload,
    };
  }

  if (action.type === "SET_MESSAGE" && action.payload) {
    return {
      ...state,
      message: action.payload,
    };
  }

  return state;
};

export default function Page() {
  const params = useParams();
  const traceId = params.traceId as string;

  const [navRef, { height }] = useMeasure();

  const [loading, setLoading] = useReducer(loadingReducer, {
    isLoaded: false,
    message: "Getting your capture session...",
  });
  const [capture, setCapture] = useState({});
  const [stepState, setStepState] = useReducer(stepReducer, {
    index: 0,
    hash: Date.now() + Math.random(),
  });

  const nextStep = () => {
    if (stepState.index < traceSteps.length - 1) {
      setStepState(stepState.index + 1);
    }
  };

  const prevStep = () => {
    if (stepState.index > 0) {
      setStepState(stepState.index - 1);
    }
  };

  // >>> DUMMY DRIVER CODE

  async function getCaptureSession(traceId: string) {
    const trace = await getTrace(traceId, { includes: { screens: true, app: false } });

    if (trace.ok) {
      return trace.data
    }
  }

  // Data fetching
  useEffect(() => {
    getCaptureSession(traceId).then((capture) => {
      if (capture) {
        setCapture(capture);
        setLoading({ type: "SET_LOADED", payload: true });
      }
    });
  }, [traceId]);

  // <<< DUMMY DRIVER CODE

  return (
    <>
      <main
        className="relative flex flex-col min-w-dvw min-h-dvh bg-white dark:bg-black"
        style={{ "--nav-height": `${height}px` } as React.CSSProperties}
      >
        {loading.isLoaded ? (
          <>
            <div className="relative flex grow w-full gap-4">
              <aside className="sticky top-0 left-0 hidden lg:flex flex-col shrink w-full h-full p-8 pr-0 max-w-xs">
                <article className="prose prose-neutral dark:prose-invert leading-snug">
                  {traceSteps[stepState.index].content}
                </article>
              </aside>
              <div className="flex flex-col grow w-full justify-center items-center">
                {stepState.index === 0 ? <SelectScreen data={capture} /> : null}
                {stepState.index === 1 ? <RepairScreen data={capture} /> : null}
                {stepState.index === 2 ? <RedactScreen data={capture} /> : null}
              </div>
            </div>
            <nav
              ref={navRef}
              className="sticky bottom-0 flex grow-0 shrink justify-between w-full px-8 py-4 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-sm"
            >
              <div className="flex gap-2 items-center">
                <h1 className="inline-flex items-center text-lg font-semibold text-neutral-950 dark:text-neutral-50">
                  <span className="inline-flex items-center text-neutral-500 dark:text-neutral-400">
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
                        mass: 0.5,
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
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={stepState.index === 0}
                >
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={stepState.index === traceSteps.length - 1}
                >
                  Next
                </Button>
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
    </>
  );
}
