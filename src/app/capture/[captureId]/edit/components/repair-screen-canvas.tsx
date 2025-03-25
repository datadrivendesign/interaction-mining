"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import { Check, ChevronsUpDown, Circle, MousePointerClick } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMeasure, useMouse } from "@uidotdev/usehooks";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { Screen, ScreenGesture } from "@prisma/client";

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
  screen: Screen;
  gesture: ScreenGesture;
  setGesture: React.Dispatch<React.SetStateAction<ScreenGesture>>;
}) {
  const [imageRef, { width, height }] = useMeasure();
  const [mouse, ref] = useMouse();
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
    const imageElement = ref.current;
    if (imageElement) {
      const { width, height } = imageElement.getBoundingClientRect();
      const relativeX = mouse.elementX / width;
      const relativeY = mouse.elementY / height;

      setGesture((prev) => ({
        ...prev,
        x: relativeX,
        y: relativeY,
      }));
    }
  };
  // const handleImageClick = () => {
  //   setGesture((prev) => {
  //     if (prev.x === null && prev.y === null) {
  //       return {
  //         ...prev,
  //         x: mouse.elementX,
  //         y: mouse.elementY,
  //       };
  //     }
  //     return prev;
  //   });
  // };

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
        }));
      }
    },
    [width, height]
  );
  // const handleDragEnd = (event: DragEndEvent) => {
  //   const { delta } = event;
  //   setGesture((prev) => ({
  //     ...prev,
  //     x: prev.x! + delta.x,
  //     y: prev.y! + delta.y,
  //   }));
  // };

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
          gesture: gesture,
          setGesture: setGesture,
        }}
      >
        <DndContext
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <div
            className="relative w-auto h-full p-4"
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
                    exit={{ x: 8 + tooltip!.x, y: 8 + tooltip!.y, opacity: 0 }}
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
                  mergeRefs(
                    ref,
                    imageRef
                  ) as React.MutableRefObject<HTMLImageElement | null>
                }
                src={screen.src}
                alt="gallery"
                draggable={false}
                className="w-fit h-full rounded-lg cursor-crosshair"
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
        <Circle className="size-4 text-yellow-800 hover:text-black" />
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

const gestureOptions = [
  {
    value: "Tap",
    label: "Tap",
  },
  {
    value: "Double tap",
    label: "Double tap",
  },
  {
    value: "Touch and hold",
    label: "Touch and hold",
  },
  {
    value: "Swipe",
    label: "Swipe",
  },
  {
    value: "Drag",
    label: "Drag",
  },
  {
    value: "Zoom",
    label: "Zoom",
  },
  {
    value: "Rotate",
    label: "Rotate",
  },
];

function GestureSelection() {
  const { gesture, setGesture } = useContext(GestureContext);
  const [open, setOpen] = useState(gesture.type === null);
  const [value, setValue] = useState(gesture.type);

  useEffect(() => {
    setGesture((prev) => ({ ...prev, type: value }));
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
          {value
            ? gestureOptions.find((gesture) => gesture.value === value)?.label
            : "Select gesture..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50 p-0">
        <Command>
          <CommandInput placeholder="Search gestures..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {gestureOptions.map((gesture) => (
                <CommandItem
                  key={gesture.value}
                  value={gesture.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === gesture.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {gesture.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
