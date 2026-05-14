"use client";

import { useState, useRef, createContext, useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import CanvasComponent, { CanvasRef } from "./canvas";
import { TraceFormData, FrameData, Redaction } from "../../types";
import Toolbar from "./toolbar";
import Layers from "./layers";

import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

type RedactCanvasMode = "pencil" | "eraser" | "select";

export type vhRootBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

export type vhBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  // content_desc: string;
  text_field: string;
  class: string;
  id: string;
};

export const RedactCanvasContext = createContext<{
  mode: RedactCanvasMode;
  setMode: (mode: RedactCanvasMode) => void;
  redactions: Redaction[];
  selected: Redaction[];
  deleteRedaction: (ids: string[]) => void;
  selectRedaction: (id: string | null, addToList: boolean) => void;
  createRedactions: (
    newRedactions: Redaction[],
    options?: { select?: boolean }
  ) => void;
  updateRedaction: (id: string, updatedRedaction: Partial<Redaction>) => void;
}>({
  mode: "select",
  setMode: () => {},
  redactions: [] as Redaction[],
  selected: [] as Redaction[],
  deleteRedaction: () => {},
  selectRedaction: () => {},
  createRedactions: () => {},
  updateRedaction: () => {},
});

export default function RedactScreenCanvas({
  screen,
  vh,
  copied,
  setCopied,
}: {
  screen: FrameData;
  vh: any;
  copied: Redaction[];
  setCopied: React.Dispatch<React.SetStateAction<Redaction[]>>;
}) {
  const { setValue } = useFormContext<TraceFormData>();
  const [watchRedactions] = useWatch({
    name: ["redactions"],
  });
  const redactions = useMemo(() => watchRedactions || {}, [watchRedactions]);
  const redactionsOnScreen: Redaction[] = useMemo(
    () => redactions[screen.id] || [],
    [redactions, screen.id]
  );

  const [selected, setSelected] = useState<Redaction[]>([]);
  const [mode, setMode] = useState<"pencil" | "eraser" | "select">("select");

  const canvasRef = useRef<CanvasRef>(null);

  const deleteRedaction = (ids: string[]) => {
    const newRedactions = redactionsOnScreen.filter((r) => !ids.includes(r.id));
    if (selected.some((r) => ids.includes(r.id))) {
      setSelected([]);
    }
    setValue("redactions", {
      ...redactions,
      [screen.id]: newRedactions,
    });
  };

  const selectRedaction = (id: string | null, addToList: boolean = true) => {
    if (id === null) {
      setSelected([]);
      return;
    }
    const selectedRedaction =
      redactionsOnScreen.find((r) => r.id === id) || null;
    if (!selectedRedaction) {
      setSelected([]);
    } else if (addToList) {
      setSelected([...selected, selectedRedaction]);
    } else {
      setSelected([selectedRedaction]);
    }
  };

  const createRedactions = (
    newRedactions: Redaction[],
    option?: {
      select?: boolean;
    }
  ) => {
    const updatedRedactions = [...redactionsOnScreen, ...newRedactions];
    setValue("redactions", {
      ...redactions,
      [screen.id]: updatedRedactions,
    });
    if (option?.select) {
      setSelected(newRedactions);
    }
  };

  const updateRedaction = useCallback(
    (id: string, updatedRedaction: Partial<Redaction>) => {
      const newRedactions = redactionsOnScreen.map((redaction) => {
        return redaction.id === id
          ? { ...redaction, ...updatedRedaction }
          : redaction;
      });
      setValue("redactions", {
        ...redactions,
        [screen.id]: newRedactions,
      });
    },
    [redactionsOnScreen, redactions, setValue, screen.id]
  );

  useHotkeys("v", () => setMode("select"));
  useHotkeys("p", () => setMode("pencil"));
  useHotkeys("e", () => setMode("eraser"));

  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 2;

  // Add these two hotkeys to zoom in/out
  useHotkeys("ctrl+equal, meta+equal", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canvasRef.current) return;
    const stage = canvasRef.current.getStage();
    if (!stage) return;

    // Get mouse pointer relative to stage
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = stage.scaleX();
    // calculate new scale, clamped to min/max
    const newScale = Math.min(oldScale * ZOOM_STEP, MAX_ZOOM);

    // Compute how pointer's position in stage coordinates shifts
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // Compute new stage position so that pointer stays at same content coords
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    stage.batchDraw();
  });

  useHotkeys("ctrl+minus, meta+minus", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canvasRef.current) return;
    const stage = canvasRef.current.getStage();
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = stage.scaleX();
    const newScale = Math.max(oldScale / ZOOM_STEP, MIN_ZOOM);

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    stage.batchDraw();
  });

  useHotkeys("ctrl+0, meta+0", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!canvasRef.current) return;
    const stage = canvasRef.current.getStage();
    if (!stage) return;

    // Reset scale to 1×
    stage.scale({ x: 1, y: 1 });

    // Reset pan back to the origin (no offset)
    stage.position({ x: 0, y: 0 });

    stage.batchDraw();
  });

  useHotkeys("esc", () => {
    setMode("select");
    setSelected([]);
  });

  useHotkeys("backspace", () => {
    if (mode === "select") {
      const redactionIds = selected.map((r) => r.id);
      deleteRedaction(redactionIds);
    }
  });

  // copy and paste redaction to other screens
  useHotkeys("ctrl+c,meta+c", (e) => {
    e.preventDefault();
    if (e.repeat) {
      return;
    }
    if (mode === "select") {
      if (selected) {
        setCopied(selected);
        toast.success("Redaction copied to clipboard");
      } else {
        toast.error("Select a redaction to copy");
      }
    }
  });

  useHotkeys("ctrl+v,meta+v", (e) => {
    e.preventDefault();
    if (e.repeat) {
      return;
    }
    if (!copied) {
      toast.error("No redaction to paste");
      return;
    }
    if (mode === "select") {
      const copyRedactions: Redaction[] = [];
      copied.forEach((r, i) => {
        copyRedactions.push({
          id: `${Date.now()}-${i}`, // unique enough id for redaction
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          annotation: r.annotation,
        });
      });
      createRedactions(copyRedactions);
      toast.success("Redaction pasted to screen");
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
        // const content_desc = "content-desc" in node ? node["content-desc"] : "";
        const text_field = "text_field" in node ? node["text_field"] : "";
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
          // content_desc,
          text_field,
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
        redactions: redactionsOnScreen,
        selected,
        deleteRedaction,
        selectRedaction,
        createRedactions,
        updateRedaction,
      }}
    >
      <div className="relative flex h-full w-full min-w-0 items-center overflow-hidden bg-neutral-50 dark:bg-neutral-950">
        <Toolbar mode={mode} setMode={setMode} />
        <Layers
          redactions={redactionsOnScreen}
          deleteRedaction={deleteRedaction}
        />
        <CanvasComponent
          key={screen.id} // Force re-render when screen changes
          ref={canvasRef}
          screen={screen}
          redactions={redactionsOnScreen}
          vh={{ vhBoxes, rootBounds }}
          mode={mode}
        />
      </div>
    </RedactCanvasContext.Provider>
  );
}
