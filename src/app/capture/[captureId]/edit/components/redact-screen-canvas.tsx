"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Check, ChevronsUpDown, Eraser, Pencil } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMouse } from "@uidotdev/usehooks";
import { DndContext, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import clsx from "clsx";
import { FrameData } from "./extract-frames";


export default function RedactScreenCanvas({ screen }: { screen: FrameData }) {
  const [mouse, ref] = useMouse();
  const [tooltip, setTooltip] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null
  });
  const [mode, setMode] = useState<"pencil" | "eraser">("pencil");

  const [gestureMarker, setGestureMarker] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });

  const handleImageClick = () => {
    // Set the marker position
    setGestureMarker({ x: mouse.elementX, y: mouse.elementY });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setGestureMarker((prev) => ({
      x: (prev?.x ?? 0) + delta.x,
      y: (prev?.y ?? 0) + delta.y,
    }));
  };

  useEffect(() => {
    console.log(gestureMarker)
  }, [gestureMarker])

  return (
    <>
      <DndContext onDragEnd={handleDragEnd} modifiers={[restrictToParentElement]}>
        <div className="relative flex w-full h-full justify-center items-center">
          {/* Toolbar */}
          <aside className="absolute z-50 left-8 flex flex-col justify-center h-full">
            <div className="flex flex-col p-4 bg-neutral-200 dark:bg-neutral-800 rounded-md shadow-md">
              <button>
                <Pencil className="h-6 w-6" />
              </button>
              <button>
                <Eraser className="h-6 w-6" />
              </button>
            </div>
          </aside>
          {/* Canvas */}
          <div
            className="relative w-auto h-full p-4"
            style={{ "--marker-radius": "0.75rem" } as React.CSSProperties}
          >

            <DroppableArea>
              <AnimatePresence>
                {/* Only show floating tool */}
                {
                  (tooltip!.x && tooltip!.y) &&
                    (!gestureMarker.x && !gestureMarker.y) ? (
                    <motion.div
                      className="absolute z-50 px-2 py-1 bg-neutral-200 dark:bg-neutral-800 rounded-md shadow-md pointer-events-none origin-left"
                      initial={{ x: 8 + tooltip!.x, y: 8 + tooltip!.y, opacity: 0 }}
                      animate={{ x: 8 + tooltip!.x, y: 8 + tooltip!.y, opacity: 1 }}
                      exit={{ x: 8 + tooltip!.x, y: 8 + tooltip!.y, opacity: 0 }}
                      transition={{ duration: 0.05 }}
                    >
                      <span className="text-xs font-medium">Add a gesture</span>
                    </motion.div>
                  ) : null
                }
              </AnimatePresence>
              {(gestureMarker.x !== null && gestureMarker.y !== null) ? (
                <DraggableMarker
                  position={gestureMarker}
                />
              ) : null}
              <Image
                ref={ref as React.MutableRefObject<HTMLImageElement | null>}
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
    </>
  )
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
  const { attributes, isDragging, listeners, setNodeRef, transform } = useDraggable({
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
          "absolute z-50 bg-yellow-400/75 hover:bg-yellow-400/100 rounded-full shadow-md transition-opacity duration-150 ease-in-out",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        {...listeners}
        {...attributes}
      >
      </motion.div>
      <div
        className="absolute z-50 ml-4"
        style={{
          left: `calc(${position.x ?? 0}px - var(--marker-radius))`,
          top: `calc(${position.y ?? 0}px) - var(--marker-radius))`,
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
    value: "Press",
    label: "Press",
  },
  {
    value: "Long press",
    label: "Long press",
  },
  {
    value: "Scroll",
    label: "Scroll"
  },
  {
    value: "Swipe",
    label: "Swipe",
  },
  {
    value: "Pinch",
    label: "Pinch",
  }
]

function GestureSelection() {
  const [open, setOpen] = useState(true)
  const [value, setValue] = useState("")

  return (
    <Popover open={open} onOpenChange={setOpen} defaultOpen>
      <PopoverTrigger asChild>
        <Button
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
          <CommandInput placeholder="Search gesture..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {gestureOptions.map((gesture) => (
                <CommandItem
                  key={gesture.value}
                  value={gesture.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
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
  )
}

