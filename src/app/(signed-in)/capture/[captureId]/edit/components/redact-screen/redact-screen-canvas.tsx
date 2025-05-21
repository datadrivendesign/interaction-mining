"use client";

import { useState, useRef, createContext, useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import CanvasComponent, { CanvasRef } from "./canvas";
import { TraceFormData } from "../types";
import { FrameData } from "../types";
import Toolbar from "./toolbar";
import Layers from "./layers";

import { Redaction } from "../types";
import { useHotkeys } from "react-hotkeys-hook";

type RedactCanvasMode = "pencil" | "eraser" | "select";

export type vhRootBounds = {
  x:number, 
  y:number, 
  width: number, 
  height: number
} | null;

export type vhBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  id: string;
};

export const RedactCanvasContext = createContext<{
  mode: RedactCanvasMode;
  setMode: (mode: RedactCanvasMode) => void;
  redactions: Redaction[];
  selected: Redaction | null;
  deleteRedaction: (id: string) => void;
  selectRedaction: (id: string | null) => void;
  createRedaction: (
    newRedaction: Redaction,
    options?: {
      select?: boolean;
    }
  ) => void;
  updateRedaction: (id: string, updatedRedaction: Partial<Redaction>) => void;
}>({
  mode: "select",
  setMode: () => {},
  redactions: [] as Redaction[],
  selected: {} as Redaction,
  deleteRedaction: () => {},
  selectRedaction: () => {},
  createRedaction: () => {},
  updateRedaction: () => {},
});

export default function RedactScreenCanvas({ 
  screen, 
  vh 
}: { 
  screen: FrameData, 
  vh: any 
}) {
  const { setValue } = useFormContext<TraceFormData>();
  const [ watchRedactions ] = useWatch({
    name: ["redactions"],
  });
  const redactions = watchRedactions || {};
  const redaction: Redaction[] = useMemo(
    () => redactions[screen.id] || [],
    [redactions, screen.id]
  );

  const [selected, setSelected] = useState<Redaction | null>(null);
  const [mode, setMode] = useState<"pencil" | "eraser" | "select">("select");

  const canvasRef = useRef<CanvasRef>(null);

  const deleteRedaction = (id: string) => {
    const newRedactions = redaction.filter((r) => r.id !== id);

    if (selected?.id === id) {
      setSelected(null);
    }

    setValue("redactions", {
      ...redactions,
      [screen.id]: newRedactions,
    });
  };

  const selectRedaction = (id: string | null) => {
    if (id === null) {
      setSelected(null);
      return;
    }
    setSelected(redaction.find((r) => r.id === id) || null);
  };

  const createRedaction = (
    newRedaction: Redaction,
    option?: {
      select?: boolean;
    }
  ) => {
    const newRedactions = [...redaction, newRedaction];
    setValue("redactions", {
      ...redactions,
      [screen.id]: newRedactions,
    });
    if (option?.select) {
      setSelected(newRedaction);
    }
  };

  const updateRedaction = useCallback(
    (id: string, updatedRedaction: Partial<Redaction>) => {
      const newRedactions = redaction.map((redaction) => {
        return redaction.id === id
          ? { ...redaction, ...updatedRedaction }
          : redaction;
      });
      setValue("redactions", {
        ...redactions,
        [screen.id]: newRedactions,
      });
    },
    [redaction, redactions, setValue, screen.id]
  );

  useHotkeys("v", () => setMode("select"));
  useHotkeys("p", () => setMode("pencil"));
  useHotkeys("e", () => setMode("eraser"));

  useHotkeys("esc", () => {
    setMode("select");
    setSelected(null);
  });
  useHotkeys("backspace", () => {
    if (mode === "select") {
      deleteRedaction(selected?.id || "");
    }
  });

  // Extract bounding boxes from hierarchy data
  const { vhBoxes, rootBounds } = useMemo(() => {
    if (!vh) return { vhBoxes: [], rootBounds: null };

    const vhBoxes: vhBox[] = [];
    let rootBounds: vhRootBounds = null;

    function traverse(node: any) {
      if (node.bounds_in_screen) {
        const [left, top, right, bottom] = node.bounds_in_screen
          .split(" ")
          .map(Number);
        const width = right - left;
        const height = bottom - top;
        const x: number = left;
        const y: number = top;
        // If rootBounds is not set, this is the root node
        if (!rootBounds) {
          rootBounds = { x, y, width, height };
        }
        // do not collect boxes with no width or height
        if (width <= 0 || height <= 0) {
          return;
        }
        vhBoxes.push({
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
    return { vhBoxes, rootBounds };
  }, [vh]);

  return (
    <RedactCanvasContext.Provider
      value={{
        mode,
        setMode,
        redactions: redaction,
        selected,
        deleteRedaction,
        selectRedaction,
        createRedaction,
        updateRedaction,
      }}
    >
      <div className="relative flex items-center w-full h-full bg-neutral-50 dark:bg-neutral-950">
        <Toolbar mode={mode} setMode={setMode} />
        <Layers redactions={redaction} deleteRedaction={deleteRedaction} />
        <CanvasComponent
          ref={canvasRef}
          screen={screen}
          redactions={redaction}
          vh={{vhBoxes, rootBounds}}
          mode={mode}
        />
      </div>
    </RedactCanvasContext.Provider>
  );
}
