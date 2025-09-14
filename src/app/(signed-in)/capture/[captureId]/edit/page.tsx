"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { useMeasure } from "@uidotdev/usehooks";
import { ChevronRight, Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCapture } from "@/lib/hooks";
import { toast } from "sonner";

import {
  DraftTraceFormData,
  RedactionSchema,
  ScreenGestureSchema,
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

import { DraftFetchResults, getDraftFiles, handleDraftSave } from "./util";
import { revalidateCaptureCaches, updateCapture } from "@/lib/actions";
import { CaptureStatus } from "@prisma/client";
import { generateSignedCloudFrontURL } from "@/lib/aws/s3/server";
import { FeedbackDialog } from "./components/repair-screen/components/feedback-dialog";

enum TraceSteps {
  Capture = 0,
  Redact = 1,
  Review = 2,
}

export default function Page() {
  const params = useParams();
  const captureId = params.captureId as string;
  const { capture, isLoading: isTraceLoading } = useCapture(captureId, {
    includes: { app: true, task: true },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftFetchResult, setDraftFetchResult] = useState<DraftFetchResults>(
    DraftFetchResults.LOADING
  );
  const [navRef, { height }] = useMeasure();
  const router = useRouter();

  const methods = useForm<TraceFormData>({
    defaultValues: {
      screens: [],
      vhs: {},
      gestures: {},
      redactions: {},
      description: "",
      iOSVersion: "",
      iPhoneVersion: "",
    },
    resolver: zodResolver(TraceFormSchema),
  });

  // populate form with saved capture data if there is any
  useEffect(() => {
    if (draftFetchResult !== DraftFetchResults.LOADING) {
      return; // Prevent multiple runs
    }

    const fetchFiles = async () => {
      const draftFilesRes = await getDraftFiles(captureId);
      if (!draftFilesRes.ok) {
        setDraftFetchResult(DraftFetchResults.ERROR);
        console.error("Failed to fetch files");
        return;
      }
      if (draftFilesRes.data.length === 0) {
        setDraftFetchResult(DraftFetchResults.NO_DRAFTS);
        return;
      }
      // sort draft files by version
      const draftFiles = draftFilesRes.data;
      const regexFileVersionRule = /draft-(\d+)\.json$/;
      draftFiles.sort((a, b) => {
        const versionA = a.fileKey.match(regexFileVersionRule);
        const versionB = b.fileKey.match(regexFileVersionRule);
        if (versionA && versionB) {
          return parseInt(versionA[1]) - parseInt(versionB[1]);
        }
        return 0;
      });
      const latestDraftFile = draftFiles[draftFiles.length - 1];
      const signedLatestDraftFileRes = await generateSignedCloudFrontURL(
        latestDraftFile.fileKey
      );
      if (!signedLatestDraftFileRes.ok) {
        setDraftFetchResult(DraftFetchResults.ERROR);
        console.error("Failed to generate signed URL");
        return;
      }
      const draftFileResponse = await fetch(
        signedLatestDraftFileRes.data.signedUrl
      );
      const draftFormData: DraftTraceFormData = await draftFileResponse.json();

      // Check if we already have screens with src data to avoid overwriting
      const currentScreens = methods.getValues("screens");
      const hasScreensWithSrc = currentScreens.some(
        (screen) => screen.src && screen.src.length > 0
      );

      if (!hasScreensWithSrc) {
        // set form data
        methods.setValue("gestures", draftFormData.gestures);
        methods.setValue("redactions", draftFormData.redactions);
        methods.setValue("description", draftFormData.description);
        // get iOS and iPhone versions for apple apps
        if (draftFormData.iOSVersion) {
          methods.setValue("iOSVersion", draftFormData.iOSVersion);
        }
        if (draftFormData.iPhoneVersion) {
          methods.setValue("iPhoneVersion", draftFormData.iPhoneVersion);
        }
        // grab screens
        console.log("populate screens from draft files");
        methods.setValue(
          "screens",
          draftFormData.screens.map((screen) => ({
            id: screen.id,
            src: "",
            timestamp: screen.timestamp,
          }))
        );
        // grab vh from android screens
        const draftVHs: { [key: string]: any } = {};
        draftFormData.screens.forEach((screen) => {
          draftVHs[screen.id] = null;
        });
        methods.setValue("vhs", draftVHs);
      } else {
        // Still set other form data that doesn't conflict
        methods.setValue("gestures", draftFormData.gestures);
        methods.setValue("redactions", draftFormData.redactions);
        methods.setValue("description", draftFormData.description);
        if (draftFormData.iOSVersion) {
          methods.setValue("iOSVersion", draftFormData.iOSVersion);
        }
        if (draftFormData.iPhoneVersion) {
          methods.setValue("iPhoneVersion", draftFormData.iPhoneVersion);
        }
      }
      setDraftFetchResult(DraftFetchResults.SUCCESS);
    };
    fetchFiles();
  }, [captureId, draftFetchResult, methods]);

  const isAutosavingRef = useRef(false);
  useEffect(() => {
    if (!capture) return;

    const autosave = async () => {
      if (isSubmitting || isAutosavingRef.current) return;

      isAutosavingRef.current = true;
      try {
        const data = methods.getValues();
        const saveRes = await handleDraftSave(data, capture);
        if (saveRes.ok) {
          toast.success("Draft autosaved");
        }
      } catch (error) {
        console.error("Autosave failed:", error);
      } finally {
        isAutosavingRef.current = false;
      }
    };

    const intervalId = setInterval(autosave, 3 * 60 * 1000); // 3 minutes
    return () => clearInterval(intervalId);
    // run once capture is ready, refactor to not have to remove dep array?
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture]);

  const [stepIndex, setStepIndex] = useState(0);

  const handleNext = async () => {
    setIsSubmitting(true);
    // check zod schema validation for each step
    if (stepIndex === TraceSteps.Capture) {
      // validate all screen gestures except the last one
      const allButLastScreenIds = methods
        .getValues()
        .screens.slice(0, -1)
        .map((s) => s.id);
      const allButLastScreenGestures = Object.fromEntries(
        Object.entries(methods.getValues().gestures).filter(([id, _]) =>
          allButLastScreenIds.includes(id)
        )
      );
      // Validate the "gestures"
      const validation = ScreenGestureSchema.safeParse({
        ...methods.getValues(),
        gestures: allButLastScreenGestures,
      });
      if (!validation.success) {
        console.error(validation.error.issues);
        const errors = validation.error.issues || "Invalid input";
        errors.forEach((error) => {
          toast.error(error.message);
        });
        setIsSubmitting(false);
        return;
      }
    } else if (stepIndex === TraceSteps.Redact) {
      // Validate the "redactions"
      const validation = RedactionSchema.safeParse(
        methods.getValues().redactions
      );
      if (!validation.success) {
        console.error(validation.error.issues);
        const errors = validation.error.issues || "Invalid input";
        errors.forEach((error) => {
          toast.error(error.message);
        });
        setIsSubmitting(false);
        return;
      }
    } else if (stepIndex === TraceSteps.Review) {
      // validate all screen gestures except the last one
      const allButLastScreenIds = methods
        .getValues()
        .screens.slice(0, -1)
        .map((s) => s.id);
      const allButLastScreenGestures = Object.fromEntries(
        Object.entries(methods.getValues().gestures).filter(([id, _]) =>
          allButLastScreenIds.includes(id)
        )
      );
      // Validate the entire trace form, especially "description"
      const validation = TraceFormSchema.safeParse({
        ...methods.getValues(),
        gestures: allButLastScreenGestures,
      });
      if (!validation.success) {
        const errors = validation.error.issues || "Invalid input";
        errors.forEach((error) => {
          toast.error(error.message);
        });
        setIsSubmitting(false);
        return;
      }
    }

    // do logic for moving to next step
    try {
      if (stepIndex < TraceSteps.Review) {
        setStepIndex(stepIndex + 1);
      } else {
        // upload progress to storage as draft state
        const data = methods.getValues();
        // save review data to s3 and route to evaluate
        const saveRes = await handleDraftSave(data, capture!);
        if (!saveRes.ok) {
          throw new Error(saveRes.message || "Failed to save draft");
        }
        const updateResult = await updateCapture(captureId, {
          status: CaptureStatus.REVIEWING,
        });
        if (!updateResult.ok) {
          throw new Error(updateResult.message || "Failed to update capture");
        }
        await revalidateCaptureCaches();
        // go to the /dashboard page
        router.push(`/dashboard`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClickSaveDraft = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = methods.getValues();
    const saveRes = await handleDraftSave(data, capture!);
    if (saveRes.ok) {
      toast.success("Draft saved");
    } else {
      toast.error(saveRes.message || "Failed to save draft");
    }
    setIsSubmitting(false);
  };

  const handlePrevious = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleClickBackToUpload = () => {
    setIsSubmitting(true);
    toast("Redirecting to upload page...", {
      description: "You can continue editing your trace later",
    });
    router.push(`/capture/${captureId}/start`);
    setIsSubmitting(false);
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
    switch (stepIndex) {
      case 0:
        return (
          <RepairScreen capture={capture} draftFetchResult={draftFetchResult} />
        );
      case 1:
        return <RedactScreen />;
      case 2:
        return <Review capture={capture} />;
      default:
        return null;
    }
  };

  // usePreventTwoFingerBack();

  return (
    <>
      <FormProvider {...methods}>
        <main
          className="relative flex flex-col w-dvw h-[calc(100dvh-64px)] bg-white dark:bg-black overflow-hidden"
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
                      {Array(stepIndex + 1)
                        .fill(0)
                        .map((_, i) => TraceSteps[i])
                        .map((step, index, array) => (
                          <Fragment key={index}>
                            <span>{step}</span>
                            {index < array.length - 1 && (
                              <ChevronRight className="size-6" />
                            )}
                          </Fragment>
                        ))}
                    </span>
                  </h1>
                  <span className="block">
                    <Sheet title={"Instructions"}>{docRender()}</Sheet>
                  </span>
                  <Button
                    className="ml-8 hover:cursor-pointer"
                    variant="destructive"
                    onClick={handleClickBackToUpload}
                    disabled={isSubmitting}
                  >
                    Back to Upload
                  </Button>
                </div>
                <div className="flex gap-4 items-center">
                  <Button
                    className="mr-8 hover:cursor-pointer"
                    variant="outline"
                    onClick={handleClickSaveDraft}
                    disabled={isSubmitting || isAutosavingRef.current}
                  >
                    {isAutosavingRef.current ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        Autosaving...
                      </>
                    ) : (
                      "Save Draft"
                    )}
                  </Button>

                  <FeedbackDialog
                    annotateFeedback={capture?.annotateFeedback ?? ""}
                    redactFeedback={capture?.redactFeedback ?? ""}
                    summarizeFeedback={capture?.summarizeFeedback ?? ""}
                  >
                    <Button variant="default">Feedback</Button>
                  </FeedbackDialog>
                </div>
                <div className="flex gap-4 items-center">
                  <Button
                    className="hover:cursor-pointer"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={stepIndex === 0}
                  >
                    Back
                  </Button>
                  {
                    <Button onClick={handleNext} disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {stepIndex < TraceSteps.Review ? "Next" : "Finish"}
                    </Button>
                  }
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
