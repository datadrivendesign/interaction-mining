"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDownFromLine,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  ArrowUpFromLine,
  Circle,
  CircleAlert,
  CircleDot,
  CircleHelp,
  CircleStop,
  Expand,
  Grab,
  IterationCcw,
  IterationCw,
  ListRestart,
  Shrink,
  X,
} from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { ScreenGesture } from "@prisma/client";
import RepairScreenCanvas from "./repair-screen-canvas";
import { cn, prettyNumber } from "@/lib/utils";
import { useFormContext, useWatch } from "react-hook-form";
import { Redaction, TraceFormData, FrameData } from "../types";
import FrameTimeline from "./extract-frames-timeline";

import { listFromS3 } from "@/lib/aws";
import { toast } from "sonner";
import useSWR from "swr";
import { CaptureScreenFile, ListedFiles, OS } from "@/lib/actions";
import { useHotkeys } from "react-hotkeys-hook";
import { AnimatePresence, motion, spring, Variants } from "motion/react";
import { extractVideoFrame } from "./utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const gestureOptions = [
  {
    value: "tap",
    label: "Tap",
    icon: <Circle className="size-4 text-yellow-800 hover:text-black" />,
  },
  {
    value: "double tap",
    label: "Double tap",
    icon: <CircleDot className="size-4 text-yellow-800 hover:text-black" />,
  },
  {
    value: "touch and hold",
    label: "Touch and hold",
    icon: <CircleStop className="size-4 text-yellow-800 hover:text-black" />,
  },
  {
    value: "swipe",
    label: "Swipe",
    subGestures: [
      {
        value: "swipe up",
        label: "Swipe up",
        icon: (
          <ArrowUpFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "swipe down",
        label: "Swipe down",
        icon: (
          <ArrowDownFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "swipe left",
        label: "Swipe left",
        icon: (
          <ArrowLeftFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "swipe right",
        label: "Swipe right",
        icon: (
          <ArrowRightFromLine className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
    ],
  },
  {
    value: "drag",
    label: "Drag",
    icon: <Grab className="size-4 text-yellow-800 hover:text-black" />,
  },
  {
    value: "zoom",
    label: "Zoom",
    subGestures: [
      {
        value: "zoom in",
        label: "Zoom in",
        icon: <Shrink className="size-4 text-yellow-800 hover:text-black" />,
      },
      {
        value: "zoom out",
        label: "Zoom out",
        icon: <Expand className="size-4 text-yellow-800 hover:text-black" />,
      },
    ],
  },
  {
    value: "rotate",
    label: "Rotate",
    subGestures: [
      {
        value: "rotate cw",
        label: "Rotate clockwise",
        icon: (
          <IterationCw className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
      {
        value: "rotate ccw",
        label: "Rotate counter-clockwise",
        icon: (
          <IterationCcw className="size-4 text-yellow-800 hover:text-black" />
        ),
      },
    ],
  },
  {
    value: "other",
    label: "Other",
    icon: <CircleHelp className="size-4 text-yellow-800 hover:text-black" />,
  },
];

export const card = {
  initial: {
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "spring",
      bounce: 0.125,
      duration: 0.5,
    },
  },
} as Variants;

export async function fileFetcher([_, fileKey]: [string, string]) {
  let res = await listFromS3(fileKey);

  if (res.ok) {
    return res.data;
  } else {
    console.error("Failed to fetch uploaded files", res.message);
    toast.error("Failed to fetch uploaded files");
    return [];
  }
}

export default function RepairScreen({ capture }: { capture: any }) {
  const [watchScreens] = useWatch({
    name: ["screens"],
  });
  const screens = watchScreens as FrameData[];

  const os = capture?.task ? capture.task.os : "none";
  const [focusViewIndex, setFocusViewIndex] = useState<number>(-1);

  const handlePrevious = useCallback(() => {
    if (focusViewIndex > 0) {
      setFocusViewIndex(focusViewIndex - 1);
    }
  }, [focusViewIndex]);

  const handleNext = useCallback(() => {
    if (focusViewIndex < screens.length - 1) {
      setFocusViewIndex(focusViewIndex + 1);
    }
  }, [focusViewIndex, screens]);

  const handleTab = useCallback(() => {
    const wrappedIndex = (focusViewIndex + 1) % screens.length;
    setFocusViewIndex(wrappedIndex);
  }, [focusViewIndex, screens]);

  useHotkeys("left", (e) => {
    e.preventDefault();
    handlePrevious();
  })

  useHotkeys("right", (e) => {
    e.preventDefault();
    handleNext();
  })

  useHotkeys("tab", (e) => {
    e.preventDefault();
    handleTab();
  })

  // Fetch file data
  const { data: files = [], isLoading: isFilesLoading } = useSWR(
    capture.id ? ["Capture files", `processed/${capture.id}`] : null,
    fileFetcher
  );

  return (
    <>
      {(os as OS).toLowerCase() === "android" ? (
        <RepairScreenAndroid 
          capture={capture} 
          files={files} 
          os={os}
          focusViewIndex={focusViewIndex} 
          setFocusViewIndex={setFocusViewIndex} 
        />
      ) : (
        <RepairScreenIOS 
          capture={capture} 
          files={files} 
          os={os}
          focusViewIndex={focusViewIndex} 
          setFocusViewIndex={setFocusViewIndex} 
        />
      )}
    </>
  );
}

function RepairScreenIOS({ 
  capture, 
  files, 
  focusViewIndex,
  os, 
  setFocusViewIndex
}: { 
  capture: any, 
  files: ListedFiles[], 
  focusViewIndex: number,
  os: OS, 
  setFocusViewIndex: (index: number) => void
}) {
  const { setValue } = useFormContext<TraceFormData>();
  const [watchScreens, watchVHs, watchGestures, watchRedactions] = useWatch({
    name: ["screens", "vhs", "gestures", "redactions"],
  });
  const screens = watchScreens as FrameData[];
  const vhs = watchVHs as { [key: string]: any };
  const gestures = watchGestures as { [key: string]: ScreenGesture };
  const redactions = watchRedactions as { [key: string]: Redaction[] };

  // video controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
        
  const MAX_THUMBS = 30;
  const frameStep = 1 / MAX_THUMBS;
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnails, setThumbnails] = useState<{
    src: string;
    timestamp: number;
    width: number;
    height: number;
  }[]>([]);

  // Load thumbnails
  const extractVideoThumbnails = useCallback(
    async (
      video: HTMLVideoElement, 
      videoDuration: number
    ): Promise<ListedFiles[]> => {
      const thumbVideo = document.createElement("video");
      thumbVideo.crossOrigin = "anonymous";
      thumbVideo.preload = "metadata";
      thumbVideo.src = video.src;
      await new Promise<void>((res) =>
        thumbVideo.addEventListener("loadedmetadata", () => res(), {
          once: true,
        })
      );
      // determine how many thumbnails to extract
      const duration = videoDuration;
      const fps = 60;
      // extract MAX_THUMBS thumbnails or every two frames, whichever is smaller
      const thumbnailCount = Math.min(
        Math.floor(duration * fps) / 2,
        MAX_THUMBS
      );
      const THUMB_HEIGHT = 128;
      const scale = THUMB_HEIGHT / thumbVideo.videoHeight;
      // need to do sequentially, parallel messes up seeking
      const thumbsRes: FrameData[] = [];
      for (let i = 0; i < thumbnailCount; i++) {
        const t = (videoDuration / thumbnailCount) * i;
        const frame = await extractVideoFrame(thumbVideo, t, scale);
        thumbsRes.push(frame);
      }
      return thumbsRes.map((f, index) => ({
        fileKey: "thumbs/",
        fileName: `frame-${index}.png`,
        fileUrl: f.src
      }))
    }, []);

    // useEffect to manually load thumbnails if video transcoding is disabled
    useEffect(() => {
      const extractThumbnails = async () => {
        const video = videoRef.current;
        const isTranscodeDisabled = (
          !process.env.NEXT_PUBLIC_TRANSCODE_LAMBDA || 
          process.env.NEXT_PUBLIC_TRANSCODE_LAMBDA === ""
        );
        if (!isTranscodeDisabled || !video || videoDuration === 0) { 
          return; 
        }   
        const thumbnailFiles = await extractVideoThumbnails(
          video, 
          videoDuration
        );
        const thumbs = thumbnailFiles.map((f, index) => ({
          src: f.fileUrl,
          timestamp: (videoDuration / thumbnailFiles.length) * index,
          width: video.videoWidth,
          height: video.videoHeight,
        }));
        setThumbnails(thumbs);
      }
      extractThumbnails();
    }, [videoRef, videoDuration])

    // useEffect to load thumbnails if video transcoding is enabled
    useEffect(() => {
      const video = videoRef.current;
      const isTranscodeDisabled = (
        !process.env.NEXT_PUBLIC_TRANSCODE_LAMBDA || 
        process.env.NEXT_PUBLIC_TRANSCODE_LAMBDA === ""
      );
      if (isTranscodeDisabled || !video || videoDuration === 0) {
        return;
      }      
      const thumbnailFiles = files.filter((f) =>
        f.fileKey.includes("thumbnails/")
      );
      const thumbs = thumbnailFiles.map((f, index) => ({
        src: f.fileUrl,
        timestamp: (videoDuration / thumbnailFiles.length) * index,
        width: video.videoWidth,
        height: video.videoHeight,
      }));
      setThumbnails(thumbs);
    }, [files, videoRef, videoDuration]);

  const videoFiles = useMemo(() => {
    const isTranscodeDisabled = (
      !process.env.NEXT_PUBLIC_TRANSCODE_LAMBDA || 
      process.env.NEXT_PUBLIC_TRANSCODE_LAMBDA === ""
    );
    const regexRule = isTranscodeDisabled ? /\.(mp4|mov)$/ : /\.(webm)$/
    return files.filter((f) => regexRule.test(f.fileKey));
  }, [files]);

  useEffect(() => {
    const loadVideoBlob = async () => {
      if (videoFiles.length > 0 && videoRef.current) {
        try {
          const response = await fetch(videoFiles[0].fileUrl);
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          videoRef.current.src = objectUrl;
        } catch (e) {
          console.error("Error loading video blob:", e);
          toast.error("Error loading video for frame extraction");
        }
      }
    };
    loadVideoBlob();
  }, [videoFiles]);

  const handleSetTime = useCallback(
    (t: number) => {
      // Sanity check
      if (!Number.isFinite(t)) return;

      // Clamp to video duration
      if (t < 0) {
        t = 0;
      } else if (t > videoDuration) {
        t = videoDuration;
      }

      t = Math.max(0, Math.min(t, videoDuration));

      const video = videoRef.current;
      if (!video) return;
      video.pause();

      // video.fastSeek(t);
      video.currentTime = t;
      setCurrentTime(t);
    },
    [videoRef, videoDuration]
  );

  const handleCaptureFrame = async () => {
    if (!videoRef.current) return;
    const f = await extractVideoFrame(videoRef.current, currentTime);
    setValue(
      "screens",
      [...screens, f].sort((a, b) => a.timestamp - b.timestamp)
    );
  };

  // Play/Pause toggle
  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? await video.play() : video.pause();
  };

  // RAF to update currentTime
  useEffect(() => {
    // Start a loop to update currentTime on each animation frame while playing
    if (isPlaying) {
      const loop = () => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(rafRef.current);
      };
    }
  }, [isPlaying]);

  // Workspace keybinds
  useHotkeys("space", async (e) => {
    e.preventDefault();
    await handlePlayPause();
  });

  useHotkeys("k", async (e) => {
    e.preventDefault();
    await handlePlayPause();
  });

  useHotkeys("left", (e) => {
      e.preventDefault();
      handleSetTime(currentTime - 5);
    },
    [currentTime, handleSetTime]
  );

  useHotkeys("j", (e) => {
      e.preventDefault();
      handleSetTime(currentTime - 5);
    },
    [currentTime, handleSetTime]
  );

  useHotkeys("right", (e) => {
      e.preventDefault();
      handleSetTime(currentTime + 5);
    },
    [currentTime, handleSetTime]
  );

  useHotkeys("l", (e) => {
      e.preventDefault();
      handleSetTime(currentTime + 5);
    },
    [currentTime, handleSetTime]
  );

  // Seek backward/forward by one frame
  useHotkeys("comma", (e) => {
      e.preventDefault();
      handleSetTime(currentTime - frameStep);
    },
    [currentTime, handleSetTime]
  );

  useHotkeys("period", (e) => {
      e.preventDefault(); 
      handleSetTime(currentTime + frameStep);
    },
    [currentTime, handleSetTime]
  );

  useHotkeys("c", (e) => {
      e.preventDefault();
      handleCaptureFrame();
    },
    { keyup: true },
    [handleCaptureFrame]
  );

  return (
    <div className="w-full h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={75} minSize={50} maxSize={75}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={33} minSize={25} maxSize={50} className="flex flex-col justify-center items-center h-full min-h-0 p-4 md:p-6 bg-neutral-50 dark:bg-neutral-950 box-border">
              <div className="flex flex-col justify-center items-center w-full h-full gap-4">
                <video
                  ref={videoRef}
                  crossOrigin="anonymous"
                  preload="auto"
                  className="max-w-full max-h-full rounded-lg object-contain"
                  controls={false}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    setVideoDuration(video.duration);
                  }}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
              <Card
                key="task"
                className={`${os === "ios" ? "right-4" : "left-4"} absolute top-4 w-56 h-32 p-3 z-10 shadow-md bg-background border rounded-md`}
                >
                <CardHeader className="flex flex-col items-center p-2">
                  <CardTitle className="font-medium">Task</CardTitle>
                  <CardDescription>
                    {capture.task?.description ?? "No description"}
                  </CardDescription>
                </CardHeader>
              </Card>                
              {(focusViewIndex > -1 && focusViewIndex < screens.length) ? (
                <FocusView
                  key={focusViewIndex}
                  vh={vhs[screens[focusViewIndex].id]}
                  screen={screens[focusViewIndex]}
                  isLastScreen={focusViewIndex === screens.length - 1}
                  os={os}
                />
              ) : (
                <div className="flex justify-center items-center w-full h-full">
                  <span className="text-3xl lg:text-4xl text-muted-foreground font-semibold">
                    Select a screen from the filmstrip.
                  </span>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={25} maxSize={50}>
          <Filmstrip
            screens={screens}
            gestures={gestures}
            redactions={redactions}
            os={os}
            focusViewIndex={focusViewIndex}
            setFocusViewIndex={setFocusViewIndex}
            handleSetTime={handleSetTime}
          />
        </ResizablePanel>
        <FrameTimeline
          src={""}
          thumbnails={thumbnails}
          currentTime={currentTime}
          videoDuration={videoDuration}
          isPlaying={isPlaying}
          handleSetTime={handleSetTime}
          handlePlayPause={handlePlayPause}
          handleCapture={handleCaptureFrame}
        />
      </ResizablePanelGroup>
    </div>
  );
}

function RepairScreenAndroid({ 
  capture, 
  files,
  os, 
  focusViewIndex,
  setFocusViewIndex
}: {
  capture: any,
  files: ListedFiles[],
  os: OS, 
  focusViewIndex: number,
  setFocusViewIndex: (index: number) => void
}) {
  const { setValue } = useFormContext<TraceFormData>();
  const [watchScreens, watchVHs, watchGestures, watchRedactions] = useWatch({
    name: ["screens", "vhs", "gestures", "redactions"],
  });

  const originalScreens = useRef<FrameData[]>([]);
  const originalVHs = useRef<{ [key: string]: any }>({});
  const originalGestures = useRef<{ [key: string]: ScreenGesture }>({});
  const currScreens = watchScreens as FrameData[];
  const currVHs = watchVHs as { [key: string]: any };
  const currGestures = watchGestures as { [key: string]: ScreenGesture };
  const redactions = watchRedactions as { [key: string]: Redaction[] }

  useEffect(() => {
    const populateFrameData = async (
      files: ListedFiles[]
    ): Promise<{
      frames: FrameData[];
      vhs: { [key: string]: any };
      gestures: { [key: string]: ScreenGesture };
    }> => {
      function createScreenGesture(gesture: ScreenGesture): ScreenGesture {
        const { x, y, scrollDeltaX, scrollDeltaY, type } = gesture;
        const screenGesture: ScreenGesture = {
          type: type,
          x,
          y,
          scrollDeltaX,
          scrollDeltaY,
          description: "",
        };

        function translateTypeAndroidToODIM(
          androidType: string,
          scrollDeltaX: number | null,
          scrollDeltaY: number | null
        ): string {
          if (androidType === "TYPE_VIEW_CLICKED" || 
            androidType == "TYPE_VIEW_SELECTED") {
            return "tap";
          } else if (androidType === "TYPE_VIEW_LONG_CLICKED") {
            return "touch and hold";
          } else if (androidType === "TYPE_VIEW_SCROLLED") {
            if (scrollDeltaX !== null && scrollDeltaY !== null) {
              // get direction of scroll/swipe w. dominant delta direction
              if (scrollDeltaX > 0 && scrollDeltaX > scrollDeltaY) {
                return "swipe right";
              } else if (scrollDeltaX < 0 && scrollDeltaX < scrollDeltaY) {
                return "swipe left";
              } else if (scrollDeltaY > 0 && scrollDeltaY > scrollDeltaX) {
                return "swipe up";
              } else if (scrollDeltaY < 0 && scrollDeltaY < scrollDeltaX) {
                return "swipe down";
              } else {
                return "other";
              }
            }
          }
          // fall through case, don't know what will reach
          return "";
        }

        if (!type || type === "") {
          screenGesture.type = null;
        } else {
          screenGesture.type = translateTypeAndroidToODIM(
            type, 
            scrollDeltaX,
            scrollDeltaY
          )
        }
        return screenGesture;
      }

      const frameData: FrameData[] = [];
      const frameVHs: { [key: string]: any } = {};
      const frameGestures: { [key: string]: ScreenGesture } = {};
      for (const [i, c] of files.entries()) {
        try {
          const frameResponse = await fetch(c.fileUrl);
          const frameJson: CaptureScreenFile = await frameResponse.json();
          const b64img = `data:image/png;base64,${frameJson.img}`.trim();
          const frame: FrameData = {
            id: frameJson.created + i.toString(),
            src: b64img,
            timestamp: Date.parse(frameJson.created),
          };
          frameData.push(frame);
          if (frameJson.vh) {
            frameVHs[frame.id] = JSON.parse(frameJson.vh);
          }
          if (frameJson.gesture) {
            frameGestures[frame.id] = createScreenGesture(frameJson.gesture);
          }
        } catch (e) {
          console.error("Error fetching frame data:", e);
          toast.error("Error fetching frame data");
        }
      }
      return {
        frames: frameData.sort((a, b) => a.timestamp - b.timestamp),
        vhs: frameVHs,
        gestures: frameGestures,
      };
    };

    populateFrameData(files).then(({ frames, vhs, gestures }) => {
      originalScreens.current = [...frames];
      originalVHs.current = { ...vhs };
      originalGestures.current = { ...gestures };

      // Only populate data if the form state is empty
      if (
        currScreens.length === 0 &&
        Object.keys(currVHs).length === 0 &&
        Object.keys(currGestures).length === 0
      ) {
        setValue("screens", frames);
        setValue("vhs", vhs);
        setValue("gestures", gestures);
      }
    });
  }, [currScreens.length, files, setValue]);

  return (
    <div className="w-full h-full">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={75} minSize={50} maxSize={75}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={33} minSize={25} maxSize={50} className="flex flex-col justify-center items-center h-full min-h-0 p-4 md:p-6 bg-neutral-50 dark:bg-neutral-950 box-border">
              <div className="flex flex-col justify-center items-center w-full h-full gap-4">
              <Card
                key="task"
                className="absolute top-4 left-4 w-56 h-32 p-3 z-10 shadow-md bg-background border rounded-md"
                >
                <CardHeader className="flex flex-col items-center p-2">
                  <CardTitle className="font-medium">Task</CardTitle>
                  <CardDescription>
                    {capture.task?.description ?? "No description"}
                  </CardDescription>
                </CardHeader>
              </Card>    

                <Button
                  onClick={() => {
                    if (originalScreens.current.length !== currScreens.length) {
                      setValue("screens", originalScreens.current);
                      setValue("vhs", originalVHs.current);
                      setValue("gestures", originalGestures.current);
                    }
                  }}
                >
                <ListRestart /> Reset Screens
              </Button>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>            
              {(focusViewIndex > -1 && focusViewIndex < currScreens.length) ? (
                <FocusView
                  key={focusViewIndex}
                  vh={currVHs[currScreens[focusViewIndex].id]}
                  screen={currScreens[focusViewIndex]}
                  isLastScreen={focusViewIndex === currScreens.length - 1}
                  os={os}
                />
              ) : (
                <div className="flex justify-center items-center w-full h-full">
                  <span className="text-3xl lg:text-4xl text-muted-foreground font-semibold">
                    Select a screen from the filmstrip.
                  </span>
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={25} maxSize={50}>
          <Filmstrip
            screens={currScreens}
            gestures={currGestures}
            redactions={redactions}
            os={os}
            focusViewIndex={focusViewIndex}
            setFocusViewIndex={setFocusViewIndex}
            handleSetTime={(_: number) => {}}  // empty function
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function FocusView({
  screen,
  vh,
  os,
  isLastScreen
}: {
  screen: FrameData;
  vh: any;
  os: OS;
  isLastScreen: boolean
}) {
  const { watch, setValue } = useFormContext<TraceFormData>();

  const gestures = watch("gestures") as { [key: string]: ScreenGesture };

  // Find applicable gesture for screen or set to default template
  const [gesture, setGesture] = useState<ScreenGesture>(
    gestures[screen.id] ?? {
      type: null,
      x: null,
      y: null,
      scrollDeltaX: 0,
      scrollDeltaY: 0,
    }
  );

  // Update gesture in form data
  useEffect(() => {
    // only update if gesture has changed
    const currentGesture = gestures[screen.id];
    // dumb way to do object equality but pay the price to fix linter error
    if (JSON.stringify(currentGesture) !== JSON.stringify(gesture)) {
      setValue("gestures", {
        ...gestures,
        [screen.id]: gesture,
      });
    }
  }, [gesture, gestures, screen.id, setValue]);

  return (
    <>
      <div className="flex justify-center w-full h-full overflow-hidden">
        <RepairScreenCanvas
          key={screen.id}
          screen={screen}
          vh={vh}
          gesture={gesture}
          setGesture={setGesture}
          gestureOptions={gestureOptions}
          os={os}
          isLastScreen={isLastScreen}
        />
      </div>
    </>
  );
}

function Filmstrip({
  screens,
  gestures,
  redactions,
  os,
  focusViewIndex,
  setFocusViewIndex,
  handleSetTime,
}: {
  screens: FrameData[];
  gestures: { [key: string]: ScreenGesture };
  redactions: { [screenId: string]: Redaction[] };
  os: OS
  focusViewIndex: number;
  setFocusViewIndex: (index: number) => void;
  handleSetTime: (t: number) => void;
}) {

  const { setValue } = useFormContext<TraceFormData>();

  const setFrameData = (value: FrameData[]) => setValue("screens", value);
  const setGestureData = (value: { [key: string]: ScreenGesture }) => {
    setValue("gestures", value);
  };
  const setRedactionData = (value: { [key: string]: Redaction[] }) => {
    setValue("redactions", value);
  };

  const handleDeleteFrame = (index: number) => {
    // reset focus view index
    setFocusViewIndex(-1);
    // remove frame from view
    const newFrameData = [...screens];
    newFrameData.splice(index, 1);
    setFrameData(newFrameData);
    // remove frame from gestures
    const updatedGestures = Object.fromEntries(
      Object.entries(gestures).filter(([key]) => key !== screens[index].id)
    );
    setGestureData(updatedGestures);
    // remove frame from redactions
    const updatedRedactions = Object.fromEntries(
      Object.entries(redactions).filter(([key]) => key !== screens[index].id)
    )
    setRedactionData(updatedRedactions);
  };


  return (
    <AnimatePresence mode="popLayout">
      <ul className="flex h-full px-2 pt-2 pb-4 gap-1 overflow-x-auto">
        {screens?.map((screen: FrameData, index: number) => {
          const isLast = screens.length - 1 === index;
          return (
          <FilmstripItem
            key={screen.id}
            index={index}
            isLast={isLast}
            screen={screen}
            redactions={redactions[screen.id] ?? []}
            os={os}
            isSelected={focusViewIndex === index}
            hasError={
              !gestures[screen.id] ||
              gestures[screen.id].type === null ||
              gestures[screen.id].description === undefined ||
              gestures[screen.id].description === ""
            }
            onClick={() => setFocusViewIndex(index)}
            handleSetTime={handleSetTime}
            handleDeleteFrame={handleDeleteFrame}
          >
          </FilmstripItem>
          )
        })}
      </ul>
    </AnimatePresence>
  );
}

function FilmstripItem({
  screen,
  redactions,
  index = 0,
  isLast = false,
  os,
  isSelected,
  hasError = false,
  handleSetTime,
  handleDeleteFrame,
  // children,
  ...props
}: {
  screen: FrameData;
  redactions: Array<Redaction>;
  index?: number;
  isLast: boolean;
  os: OS;
  isSelected?: boolean;
  hasError?: boolean;
  handleSetTime: (t: number) => void;
  handleDeleteFrame: (index: number) => void;
  // children?: React.ReactNode;
} & React.HTMLAttributes<HTMLLIElement>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    scaleX: number;
    scaleY: number;
  }>({ width: 0, height: 0, offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 });

  const updateSize = () => {
    if (containerRef.current && imageRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const imageRect = imageRef.current.getBoundingClientRect();
      const naturalWidth = imageRef.current.naturalWidth;
      const naturalHeight = imageRef.current.naturalHeight;
      // Calculate the scale factor between the natural and displayed size:
      const scaleX = imageRect.width / naturalWidth;
      const scaleY = imageRect.height / naturalHeight;
      // Compute offsets in case the image is letterboxed inside its container:
      const offsetX = (containerRect.width - imageRect.width) / 2;
      const offsetY = (containerRect.height - imageRect.height) / 2;
      setImgDimensions({
        width: imageRect.width,
        height: imageRect.height,
        offsetX,
        offsetY,
        scaleX,
        scaleY,
      });
    }
  };

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <motion.div
      className="min-w-fit h-full max-w-full"
      variants={card}
      initial="initial"
      animate="animate"
      exit="exit"
      layout="position"
      transition={spring}
      key={`${screen.timestamp}-${screen.id}`}
      onClick={() => handleSetTime(screen.timestamp)}
    
    >
      <li
        className="cursor-pointer min-w-fit h-full"
        data-index={index}
        {...props}
      >
        {/* Toolbar */}
        <div className="flex flex-row w-full items-center justify-between">
          <div className="flex p-1 justify-center items-center bg-background rounded-lg">
            <span
              className="text-sm text-muted-foreground tracking-tight leading-none slashed-zero tabular-nums"
              title={`Jump to time: ${prettyNumber(screen.timestamp, os)}s`}
            >
              {`${prettyNumber(screen.timestamp, os)}s`}
            </span>
          </div>
          <button
            onClick={() => handleDeleteFrame(index)}
            className="inline-flex self-end items-center cursor-pointer"
            title="Delete snapshot"
          >
            <X className="size-6 text-muted-foreground hover:opacity-75" />
          </button>
        </div>
        <div 
          ref={containerRef}
          className="relative h-full rounded-sm overflow-clip transition-all duration-200 ease-in-out select-none object-contain"
        >
          {(isSelected || hasError) && !isLast && (
            <div
              className={cn(
                "absolute z-10 flex w-full h-full justify-center items-center rounded-sm",
                isSelected
                  ? "ring-2 ring-inset ring-yellow-500"
                  : hasError
                    ? "ring-2 ring-inset ring-red-500"
                    : ""
              )}
            >
              {hasError  && (
                <CircleAlert
                  className={cn(
                    "size-6",
                    isSelected ? "text-yellow-500" : "text-red-500"
                  )}
                />
              )}
            </div>
          )}
          <div
            className={cn(
              "relative min-w-fit h-full transition-all duration-200 ease-in-out select-none",
              hasError && !isLast
                ? "grayscale brightness-50"
                : "grayscale-0 brightness-100"
            )}
          >
            {/* {children} */}
            <Image
              ref={imageRef}
              key={screen.id}
              src={screen.src}
              alt="gallery"
              draggable={false}
              className="h-full w-auto object-contain"
              width={0}
              height={0}
              sizes="100vw"
            />
            {/* Render redaction overlays using the natural dimensions and scale factors */}
            {imgDimensions.width > 0 &&
              redactions.map((rect, idx) => (
                <div
                  key={idx}
                  style={{
                    position: "absolute",
                    top:
                      imgDimensions.offsetY +
                      rect.y *
                        imageRef.current!.naturalHeight *
                        imgDimensions.scaleY,
                    left:
                      imgDimensions.offsetX +
                      rect.x *
                        imageRef.current!.naturalWidth *
                        imgDimensions.scaleX,
                    width:
                      rect.width *
                      imageRef.current!.naturalWidth *
                      imgDimensions.scaleX,
                    height:
                      rect.height *
                      imageRef.current!.naturalHeight *
                      imgDimensions.scaleY,
                    backgroundColor: "black",
                    border: "1px solid black",
                  }}
                />
              ))}
          </div>
        </div>
      </li>
    </motion.div>
  );
}
