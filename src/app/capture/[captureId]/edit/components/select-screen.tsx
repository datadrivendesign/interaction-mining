"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useId,
} from "react";
import Image from "next/image";
import { GlobalHotKeys } from "react-hotkeys";
import {
  DndContext,
  useDroppable,
  useDraggable,
  DragStartEvent,
  DragMoveEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import clsx from "clsx";

import { Screen } from "@prisma/client";

const GalleryContext = createContext<{
  selection: {
    root: number | null;
    items: number[];
  };
  setSelection: React.Dispatch<
    React.SetStateAction<{
      root: number | null;
      items: number[];
    }>
  >;
}>({
  selection: {
    root: null,
    items: [],
  },
  setSelection: () => {},
});

export default function SelectScreen({ screens }: { screens: Screen[] }) {
  const id = useId();
  const [isShift, setIsShift] = useState(false);
  const [selection, setSelection] = useState<{
    root: number | null;
    items: number[];
  }>({
    root: null,
    items: [],
  });

  const keymap = {
    SHIFT_DOWN: {
      name: "SHIFT_DOWN",
      sequence: "shift",
      action: "keydown",
    },
    SHIFT_UP: {
      name: "SHIFT_UP",
      sequence: "shift",
      action: "keyup",
    },
  };

  const handlers = {
    SHIFT_DOWN: () => setIsShift(true),
    SHIFT_UP: () => setIsShift(false),
  };

  const handleShiftSelection = (index: number) => {
    let newSelection = { ...selection };

    if (selection.root !== null && isShift) {
      // Determine range between root and index
      const start = Math.min(selection.root, index);
      const end = Math.max(selection.root, index);

      // Include all indices in the range
      newSelection = {
        ...selection,
        items: Array.from({ length: end - start + 1 }, (_, i) => start + i),
      };
    } else {
      // Set a new root and clear selection
      newSelection = {
        root: index,
        items: [index],
      };
    }

    setSelection(newSelection);
  };

  const handleRangeSelection = (start: number, end: number) => {
    const trueStart = Math.min(start, end);
    const trueEnd = Math.max(start, end);

    const newSelection = {
      root: start,
      items: Array.from(
        { length: trueEnd - trueStart + 1 },
        (_, i) => trueStart + i
      ),
    };

    setSelection(newSelection);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const index = event.active.data.current!.index;
    if (selection.root !== null && isShift) {
      handleShiftSelection(index);
    } else {
      setSelection({
        root: index,
        items: [index],
      });
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { over } = event;

    if (!over) {
      return;
    }

    const index = over.data.current!.index;
    if (selection.root !== null) {
      handleRangeSelection(selection.root, index);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;

    if (!over) {
      return;
    }

    const index = over.data.current!.index;
    if (selection.root !== null && over) {
      if (isShift) {
        handleShiftSelection(index);
      } else {
        handleRangeSelection(selection.root, index);
      }
    }
  };

  return (
    <>
      <DndContext
        id={id}
        autoScroll
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <GalleryContext.Provider
          value={{
            selection,
            setSelection,
          }}
        >
          {/* @ts-ignore keyMap has some weird prop discrepancy */}
          <GlobalHotKeys keyMap={keymap} handlers={handlers}>
            <div className="w-full h-full p-8">
              <ul className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {screens?.map((screen: Screen, index: number) => (
                  <SelectScreenItem key={screen.id} index={index}>
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
                ))}
              </ul>
            </div>
          </GlobalHotKeys>
        </GalleryContext.Provider>
      </DndContext>
    </>
  );
}

export function SelectScreenItem({
  index = 0,
  children,
}: {
  index?: number;
  children?: React.ReactNode;
}) {
  const { selection } = useContext(GalleryContext);
  // Initialize `useDroppable`
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `dnd-${index}`,
    data: { index },
  });

  // Initialize `useDraggable`
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
  } = useDraggable({
    id: `dnd-${index}`,
    data: { index },
  });

  // Combine refs for draggable and droppable
  const combinedRef = useCallback(
    (node: HTMLElement | null) => {
      setDroppableRef(node); // Attach droppable ref
      setDraggableRef(node); // Attach draggable ref
    },
    [setDroppableRef, setDraggableRef] // Dependency array ensures the function is stable
  );

  return (
    <li
      ref={combinedRef}
      className="p-2"
      {...attributes}
      {...listeners}
      data-index={index}
    >
      <div
        className={clsx(
          "relative w-full h-full rounded-lg overflow-clip transition-all duration-200 ease-in-out select-none",
          selection.root === index || selection.items.includes(index)
            ? "outline-3 outline-yellow-400 grayscale-0"
            : "grayscale"
        )}
      >
        {(selection.root === index || selection.items.includes(index)) && (
          <div className="absolute z-10 top-2 right-2 flex size-6 justify-center items-center bg-yellow-400 rounded-md aspect-square">
            <span className="text-black text-xs tracking-tighter leading-none tabular-nums">
              {selection.items.indexOf(index) + 1}
            </span>
          </div>
        )}
        {children}
      </div>
    </li>
  );
}
