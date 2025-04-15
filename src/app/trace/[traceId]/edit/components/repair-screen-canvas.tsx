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
    [ref, width, height, setGesture]
  );

  useEffect(() => {
    const { x: markerX, y: markerY }  = markerPixelPosition
    if (
      (markerX !== gesture.x ||
        markerY !== gesture.y) &&
      width &&
      height
    ) {
      setMarkerPixelPosition({
        x: gesture.x ? gesture.x * width : null,
        y: gesture.y ? gesture.y * height : null,
      });
    }
  }, [gesture, markerPixelPosition, width, height]);

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
            className="relative w-full h-full p-4 bg-neutral-50 dark:bg-neutral-950"
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
              <figure className="relative w-full h-full">
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
                  className="w-auto h-full rounded-lg cursor-crosshair"
                  fill
                  onClick={handleImageClick}
                  onMouseMove={() => {
                    setTooltip({ x: mouse.elementX, y: mouse.elementY });
                  }}
                />
              </figure>
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
