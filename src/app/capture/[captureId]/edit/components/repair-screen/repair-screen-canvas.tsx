"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { ArrowDownFromLine, ArrowLeftFromLine, ArrowRightFromLine, ArrowUpFromLine, Check, ChevronRight, ChevronsUpDown, Circle, CircleDashed, CircleDot, CircleStop, Expand, Grab, IterationCcw, IterationCw, Shrink } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMeasure, useMouse } from "@uidotdev/usehooks";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { ScreenGesture } from "@prisma/client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import clsx from "clsx";
import mergeRefs from "@/lib/utils/merge-refs";
import { FrameData } from "../extract-frames";
import { GestureOption } from "../types";

export const GestureContext = createContext<{
  gesture: ScreenGesture;
  setGesture: React.Dispatch<React.SetStateAction<ScreenGesture>>;
}>({
  gesture: {
    type: null,
    x: null,
    y: null,
    scrollDeltaX: null,
    scrollDeltaY: null,
  },
  setGesture: () => {},
});

export default function RepairScreenCanvas({
  screen,
  gesture,
  setGesture,
}: {
  screen: FrameData;
  gesture: ScreenGesture;
  setGesture: React.Dispatch<React.SetStateAction<ScreenGesture>>;
}) {
  // memoize gesture and setGesture to avoid unnecessary re-renders
  const memoizedGestureState = useMemo(() => {
    console.log("memoize")
    return { gesture, setGesture}
  }, [gesture, setGesture]);
  const [imageRef, { width, height }] = useMeasure();
  const [mouse, ref] = useMouse();
  const mergedRef = useMemo(
    () => { console.log("mergeRef"); return mergeRefs(ref, imageRef)},
    [ref, imageRef]
  );
  const [tooltip, setTooltip] = useState<{
    x: number | null;
    y: number | null;
  }>({
    x: null,
    y: null,
  });

  const [markerPixelPosition, setMarkerPixelPosition] = useState<{
    x: number | null;
    y: number | null;
  }>({
    x: null,
    y: null,
  });
  console.log("RepairScreenCanvas");

  // Set initial marker position on image
  const handleImageClick = () => {
    if (width && height) {
      const relativeX = mouse.elementX / width;
      const relativeY = mouse.elementY / height;

      setGesture((prev) => ({
        ...prev,
        x: relativeX,
        y: relativeY,
        scrollDeltaX: prev.type === "Swipe left" ? -0.02 : (prev.type === "Swipe right" ? 0.02 : 0),
        scrollDeltaY: prev.type === "Swipe down" ? -0.02 : (prev.type === "Swipe up" ? 0.02 : 0)
      }));
    }
  };

  // Update marker position on drag
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const imageElement = ref.current;
      if (imageElement && width && height) {
        const { delta } = event;
        // Calculate proportional delta
        const deltaX = delta.x / width;
        const deltaY = delta.y / height;

        setGesture((prev) => ({
          ...prev,
          x: prev.x! + deltaX,
          y: prev.y! + deltaY,
          scrollDeltaX: prev.type === "Swipe left" ? -0.02 : (prev.type === "Swipe right" ? 0.02 : 0),
          scrollDeltaY: prev.type === "Swipe down" ? -0.02 : (prev.type === "Swipe up" ? 0.02 : 0)
        }));
      }
    },
    [width, height]
  );

  useEffect(() => { 
    if (
      (markerPixelPosition.x !== gesture.x ||
        markerPixelPosition.y !== gesture.y) &&
      width &&
      height
    ) {
      setMarkerPixelPosition({
        x: gesture.x ? gesture.x * width : null,
        y: gesture.y ? gesture.y * height : null,
      });
    }
  }, [gesture, width, height]);

  return (
    <>
      <GestureContext.Provider
        value={{
          gesture: memoizedGestureState["gesture"],
          setGesture: memoizedGestureState["setGesture"],
        }}
      >
        <DndContext
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <div className="flex justify-center items-center w-full h-full bg-neutral-50 dark:bg-neutral-950 p-4">
            <div
              className="relative w-auto h-full"
              style={{ "--marker-radius": "1rem" } as React.CSSProperties}
            >
              <DroppableArea>
                <AnimatePresence>
                  {/* Only show floating tooltip when no marker is placed  */}
                  {tooltip!.x && tooltip!.y && !gesture.x && !gesture.y ? (
                    <motion.div
                      className="absolute z-50 px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded-md shadow-md pointer-events-none origin-left"
                      initial={{
                        x: 8 + tooltip!.x,
                        y: 8 + tooltip!.y,
                        opacity: 0,
                      }}
                      animate={{
                        x: 8 + tooltip!.x,
                        y: 8 + tooltip!.y,
                        opacity: 1,
                      }}
                      exit={{
                        x: 8 + tooltip!.x,
                        y: 8 + tooltip!.y,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.05 }}
                    >
                      <span className="text-xs font-medium">Add a gesture</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                {markerPixelPosition.x !== null &&
                markerPixelPosition.y !== null ? (
                  <DraggableMarker position={markerPixelPosition} />
                ) : null}
                <Image
                  ref={
                    mergedRef as React.MutableRefObject<HTMLImageElement | null>
                  }
                  src={screen.url}
                  alt="gallery"
                  draggable={false}
                  className="w-auto h-full rounded-lg cursor-crosshair"
                  width={0}
                  height={0}
                  sizes="100vw"
                  onClick={handleImageClick}
                  onMouseMove={() => {
                    setTooltip({ x: mouse.elementX, y: mouse.elementY });
                  }}
                />
              </DroppableArea>
            </div>
          </div>
        </DndContext>
      </GestureContext.Provider>
    </>
  );
}

function DroppableArea({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: "screenshot" });
  return (
    <div ref={setNodeRef} className="relative w-full h-full">
      {children}
    </div>
  );
}

const gestureOptions: GestureOption[] = [
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
  }
];

function DraggableMarker({
  position,
}: {
  position: { x: number | null; y: number | null };
  props?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useDraggable({
      id: "gestureMarker",
    });
  const { gesture, setGesture } = useContext(GestureContext);
  console.log("setGesture")

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={{
          left: `calc(${position.x ?? 0}px - var(--marker-radius))`,
          top: `calc(${position.y ?? 0}px - var(--marker-radius))`,
          width: "calc(var(--marker-radius) * 2)",
          height: "calc(var(--marker-radius) * 2)",
          transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0)`,
        }}
        className={clsx(
          "absolute z-50 flex justify-center items-center bg-yellow-400/75 hover:bg-yellow-400/100 rounded-full shadow-md transition-colors duration-150 ease-in-out",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        {...listeners}
        {...attributes}
      >
        {gesture.type
            ? gestureOptions
              .flatMap((gesture) => [gesture, ...(gesture.subGestures ?? [])])
              .find((option) => option.value === gesture.type )?.icon
            :  <CircleDashed className="size-4 text-yellow-800 hover:text-black" />}
      </motion.div>
      <div
        className="absolute z-50 ml-2"
        style={{
          left: `calc(${position.x ?? 0}px + var(--marker-radius))`,
          top: `calc(${position.y ?? 0}px - var(--marker-radius))`,
          transform: `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0)`,
        }}
      >
        <GestureSelection />
      </div>
    </>
  );
}

function GestureSelection() {
  const { gesture, setGesture } = useContext(GestureContext);
  console.log("setGesture")
  const [open, setOpen] = useState(gesture.type === null);
  const [value, setValue] = useState(gesture.type);

  // Update gesture type when value changes
  useEffect(() => {
    if (value !== "") {
      setGesture((prev) => ({ ...prev, type: value }));
    } else {
      // Reset gesture type when value is empty i.e. empty string i.e. no gesture selected
      setGesture((prev) => ({ ...prev, type: null }));
    }
  }, [value]);


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-50 justify-between"
        >
          {value ? 
            gestureOptions
              .flat()
              .flatMap((option) => [option, ...(option.subGestures ?? [])])
              .find((option) => option.value === value)?.label : 
            "Select gesture..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50 p-0">
        <Command>
          <CommandInput placeholder="Search gestures..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {gestureOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    if (option.subGestures === undefined) {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}

                  {option.subGestures && 
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={null}
                          className="relative w-full h-full"
                        >
                          <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-50 p-0" align="start" side="right">
                        <Command>
                          <CommandList>
                            {option.subGestures.map((subGesture) => (
                              <CommandItem
                                key={subGesture.value}
                                value={subGesture.value}
                                onSelect={(currentValue) => {
                                  setValue(
                                    currentValue === value ? "" : currentValue
                                  );
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4",
                                    subGesture.value === value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {subGesture.label}
                              </CommandItem>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>  
                    </Popover>
                  }
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}