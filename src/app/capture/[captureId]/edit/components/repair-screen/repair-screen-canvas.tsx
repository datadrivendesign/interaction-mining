"use client";

import React, {
  createContext,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { Check, ChevronRight, ChevronsUpDown, CircleDashed } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import clsx from "clsx";
import mergeRefs from "@/lib/utils/merge-refs";
import { Textarea } from "@/components/ui/textarea";
import { FrameData, GestureOption } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const GestureContext = createContext<{
  gesture: ScreenGesture;
  setGesture: React.Dispatch<React.SetStateAction<ScreenGesture>>;
  gestureOptions: GestureOption[];
}>({
  gesture: {
    type: null,
    x: null,
    y: null,
    scrollDeltaX: null,
    scrollDeltaY: null,
    description: ""
  },
  setGesture: () => {},
  gestureOptions: [],
});

type FocusedBox = {
  id?: string, 
  class?: string, 
  x?: number, 
  y?: number, 
  width?: number, 
  height?: number
}

export default function RepairScreenCanvas({
  screen,
  vh,
  gesture,
  setGesture,
  gestureOptions,
  os
}: {
  screen: FrameData;
  vh: any;
  gesture: ScreenGesture;
  setGesture: React.Dispatch<React.SetStateAction<ScreenGesture>>;
  gestureOptions: GestureOption[];
  os: string;
}) {
  const [imageRef, { width, height }] = useMeasure();
  const [mouse, ref] = useMouse();
  const mergedRef = useMemo(
    () => { return mergeRefs(ref, imageRef)},
    [ref, imageRef]
  );

  const [showBoxes, setShowBoxes] = useState<boolean>(false)
  const [focusedBox, setFocusedBox] = useState<FocusedBox>({})
  // memoize gesture and setGesture to avoid unnecessary re-renders
  const memoizedGestureState = useMemo(() => {
    return { gesture, setGesture }
  }, [gesture, setGesture]);  
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
    [ref, width, height, setGesture]
  );

  useEffect(() => {
    const { x: markerX, y: markerY } = markerPixelPosition;
    const { x: gestureX, y: gestureY } = gesture;
    if (width && height && gestureX && gestureY && 
      (markerX !== gestureX*width || markerY !== gestureY*height)
    ) {
      setMarkerPixelPosition({
        x: gestureX ? gestureX * width : null,
        y: gestureY ? gestureY * height : null,
      });
    }
  }, [gesture, markerPixelPosition, width, height]);

  // Extract bounding boxes from hierarchy data
  const { boxes, rootBounds } = useMemo(() => {
    if (!vh) return { boxes: [], rootBounds: null };

    const boxes: any[] = [];
    let rootBounds: any = null;

    function traverse(node: any) {
      if (node.bounds_in_screen) {
        const [left, top, right, bottom] = node.bounds_in_screen
          .split(" ")
          .map(Number);
        const width = right - left;
        const height = bottom - top;
        const x = left;
        const y = top;
        // If rootBounds is not set, this is the root node
        if (!rootBounds) {
          rootBounds = { x, y, width, height };
        }
        // do not collect boxes with no width or height
        if (width <= 0 || height <= 0) {
          return
        }
        boxes.push({
          x,
          y,
          width,
          height,
          class: node.class_name,
          id: node.id || `null_id_${Math.random().toString()}`,
        });
      }
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => traverse(child));
      }
    }
    traverse(vh);
    return { boxes, rootBounds };
  }, [vh]);

  useEffect(() => {
    // find new box at gesture position
    if (showBoxes && 
      gesture.x !== null && gesture.y !== null && 
      rootBounds.height != null && rootBounds.width != null
    ) {
      const gestureX = gesture.x
      const gestureY = gesture.y
      const foundBox = boxes.findLast(box => (
        gestureX >= box.x / rootBounds.width && 
        gestureX <= (box.x + box.width) / rootBounds.width &&
        gestureY >= box.y / rootBounds.height && 
        gestureY <= (box.y + box.height) / rootBounds.height
      )) ?? {}
      setFocusedBox(foundBox)
    }
  }, [gesture.x, gesture.y, rootBounds, boxes, showBoxes])

  return (
    <>
      <GestureContext.Provider
        value={{
          gesture: memoizedGestureState["gesture"],
          setGesture: memoizedGestureState["setGesture"],
          gestureOptions: gestureOptions,
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
                    mergedRef as MutableRefObject<HTMLImageElement | null>
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
                {os === 'android' ? 
                  <BoundingBoxOverlay 
                    showRedaction={showBoxes}
                    mergedRef={
                      mergedRef as MutableRefObject<HTMLImageElement | null>
                    }
                    height={height}
                    width={width}
                    boxes={boxes} 
                    rootBounds={rootBounds}
                  /> : 
                  <></>}
              </DroppableArea>
            </div>
            {os === 'android' ? 
              <FocusedElementTab 
                showRedaction={showBoxes}
                setShowRedaction={setShowBoxes}
                focusedBox={focusedBox} 
              /> : 
              <></>}
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
  
  const { gesture, setGesture, gestureOptions } = useContext(GestureContext);

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={{
          left: `calc(${position.x ?? 0}px - var(--marker-radius))`,
          top: `calc(${position.y ?? 0}px - var(--marker-radius))`,
          width: "calc(var(--marker-radius) * 2)",
          height: "calc(var(--marker-radius) * 2)",
          transform: `translate3d(${transform?.x ?? 0}px, ${
            transform?.y ?? 0
          }px, 0)`,
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
          transform: `translate3d(${transform?.x ?? 0}px, ${
            transform?.y ?? 0
          }px, 0)`,
        }}
      >
        <GestureSelection />
        {gesture.type !== null ?        
          <Textarea 
            className="ml-1 border-black text-black placeholder-gray-500 text-sm w-full h-full"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)' }}
            placeholder="Specify gesture, why gesture, and interacted element."
            value={gesture.description ? gesture.description : ""}
            onChange={(e) => setGesture((prev) => ({ ...prev, description: e.target.value }))}
          /> : 
          <></>
        }
      </div>
    </>
  );
}

function FocusedElementTab({
  showRedaction,
  setShowRedaction,
  focusedBox
}: {
  showRedaction: boolean,
  setShowRedaction: React.Dispatch<React.SetStateAction<boolean>>,
  focusedBox: FocusedBox
}) {
  return(
    <Card className="absolute right-0 top-0 mr-5 mt-5 w-auto h-auto">
      <CardHeader>
        <CardTitle>Gesture Interaction Element</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 mb-5">
          <Switch 
            checked={showRedaction}
            onCheckedChange={(checked) => {setShowRedaction(checked)}}
          />
          <span className="pl-3">Show Bounding Boxes</span>
        </div>
        {showRedaction ? (
          <>
            <div className="space-y-1 flex flex-row mb-5">
              <div 
                className="w-15 flex flex-col justify-center items-center"
              >
                <Label 
                  htmlFor="x0"
                  className="text-sm font-bold leading-none mb-1"
                >
                  x0
                </Label>
                <Input
                  id="x0"
                  className="text-sm font-normal text-muted-foreground"
                  readOnly={true}
                  value={focusedBox.x ?? -1} />
              </div>
              <div 
                className="w-15 flex flex-col justify-center items-center mr-3"
              >
                <Label 
                  htmlFor="y0"
                  className="text-sm font-bold leading-none mb-1"
                >
                  y0
                </Label>
                <Input
                  id="y0"
                  className="text-sm font-normal text-muted-foreground"
                  readOnly={true}
                  value={focusedBox.y ?? -1} />
              </div>
              <div 
                className="w-15 flex flex-col justify-center items-center"
              >
                <Label 
                  htmlFor="x1"
                  className="text-sm font-bold leading-none mb-1"
                >
                  x1
                </Label>
                <Input
                  id="x1"
                  className="text-sm font-normal text-muted-foreground"
                  readOnly={true}
                  value={(focusedBox.x ?? -1) + (focusedBox.width ?? -1)} />
              </div>
              <div 
                className="w-15 flex flex-col justify-center items-center"
              >
                <Label 
                  htmlFor="y1"
                  className="text-sm font-bold leading-none mb-1"
                >
                  y1
                </Label>
                <Input
                  id="y1"
                  className="text-sm font-normal text-muted-foreground"
                  readOnly={true}
                  value={(focusedBox.y ?? -1) + (focusedBox.height ?? -1)} />
              </div>
            </div>
            <div className="space-y-1 mb-5">
              <Label 
                htmlFor="elemId"
                className="text-base font-bold leading-none"
              >
                Element Id
              </Label>
              <Input
                id="elemId"
                className="text-sm font-normal text-muted-foreground"
                readOnly={true}
                value={focusedBox.id ?? ""} />
            </div>
            <div className="space-y-1">
              <Label 
                className="text-base font-bold leading-none"
                htmlFor="elemClass"
              >
                Element Class
              </Label>
              <Input
                id="elemClass"
                className="text-sm font-normal text-muted-foreground"
                readOnly={true}
                value={focusedBox.class ?? ""} />
            </div>
          </>
        ) :
        <></>}
      </CardContent>
    </Card>
  )
}

function GestureSelection() {
  const { gesture, setGesture, gestureOptions } = useContext(GestureContext);
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
  }, [value, setGesture]);

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
                            {option.subGestures.map((gesture: GestureOption) => (
                              <CommandItem
                                key={gesture.value}
                                value={gesture.value}
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
                                    gesture.value === value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {gesture.label}
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

function BoundingBoxOverlay({
  showRedaction,
  mergedRef,
  height,
  width,
  boxes,
  rootBounds
}: {
  showRedaction: boolean,
  mergedRef: MutableRefObject<HTMLImageElement | null>,
  height: number | null,
  width: number | null,
  boxes: any[],
  rootBounds: any
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const img = (mergedRef as MutableRefObject<HTMLImageElement | null>).current
    if (!height || !width || !img || !svg) return;
    // Use ResizeObserver to synchronize SVG dimensions with image dimensions
    const resizeObserver = new ResizeObserver(() => {
      svg.style.width = `${width}px`;
      svg.style.height = `${height}px`;
    });
    resizeObserver.observe(img);
    // Cleanup observer
    return () => {
      resizeObserver.unobserve(img);
    };
  }, [height, width, mergedRef, svgRef]);

  if (!rootBounds) {
    return null; // Render nothing if rootBounds is not available
  }

  return (
    <div>
      {showRedaction && (
        <svg
          ref={svgRef}
          viewBox={`${rootBounds.x} ${rootBounds.y} ${rootBounds.width} ${rootBounds.height}`}
          preserveAspectRatio="xMinYMin meet"
          className="pointer-events-none top-0 left-0 absolute cursor-crosshair"
        >
          {boxes.map((box: any, index: number) => (
            <BoundingBox
              key={box.id + index}
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
            />
          ))}
        </svg>
      )}
    </div>
  );
}

function BoundingBox({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={"transparent"}
      stroke="red"
      strokeWidth="1"
      className="pointer-events-none"
    />
  );
}