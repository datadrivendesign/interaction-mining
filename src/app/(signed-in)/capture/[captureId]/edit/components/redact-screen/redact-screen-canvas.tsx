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
  content_desc: string;
  text_field: string;
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
  setMode: () => { },
  redactions: [] as Redaction[],
  selected: {} as Redaction,
  deleteRedaction: () => { },
  selectRedaction: () => { },
  createRedaction: () => { },
  updateRedaction: () => { },
});

export default function RedactScreenCanvas({
  screen,
  vh,
  copied,
  setCopied
}: {
  screen: FrameData,
  vh: any,
  copied: Redaction | null,
  setCopied: React.Dispatch<React.SetStateAction<Redaction | null>>
}) {
  const { setValue } = useFormContext<TraceFormData>();
  const [watchRedactions] = useWatch({
    name: ["redactions"],
  });
  const redactions = watchRedactions || {};
  const redactionsOnScreen: Redaction[] = useMemo(
    () => redactions[screen.id] || [],
    [redactions, screen.id]
  );

  const [selected, setSelected] = useState<Redaction | null>(null);
  const [mode, setMode] = useState<"pencil" | "eraser" | "select">("select");

  const canvasRef = useRef<CanvasRef>(null);

  const deleteRedaction = (id: string) => {
    const newRedactions = redactionsOnScreen.filter((r) => r.id !== id);

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
    setSelected(redactionsOnScreen.find((r) => r.id === id) || null);
  };

  const checkCanCopyRedaction = (): { status: boolean, message: string } => {
    if (!copied) { return { status: false, message: "No redaction to copy" }; }
    // if no redactions exist yet, paste is possible
    if (redactionsOnScreen.length === 0) {
      return { status: true, message: "Redaction can be pasted" };
    }
    // if redactions exist, check if the copied redaction is a duplicate
    const isDuplicateExist = redactionsOnScreen.every((r) =>
      copied.x === r.x &&
      copied.y === r.y &&
      copied.width === r.width &&
      copied.height === r.height
    );
    return {  // if duplicate, unable to paste
      status: !isDuplicateExist,
      message: isDuplicateExist ?
        "Redaction already exists" :
        "Redaction can be pasted"
    }
  }

  const createRedaction = (
    newRedaction: Redaction,
    option?: {
      select?: boolean;
    }
  ) => {
    const newRedactions = [...redactionsOnScreen, newRedaction];
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
    setSelected(null);
  });

  useHotkeys("backspace", () => {
    if (mode === "select") {
      deleteRedaction(selected?.id || "");
    }
  });

  // copy and paste redaction to other screens
  useHotkeys("ctrl+c,meta+c", (e) => {
    e.preventDefault()
    if (e.repeat) { return; }
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
    e.preventDefault()
    if (e.repeat) { return; }
    if (mode === "select") {
      const result = checkCanCopyRedaction();
      if (!result.status) { // cannot copy
        toast.error(result.message);
      } else { // add copied redaction to screen
        createRedaction({
          id: `${Date.now()}`, // unique enough id for redaction
          x: copied!.x,
          y: copied!.y,
          width: copied!.width,
          height: copied!.height,
          annotation: copied!.annotation,
        }),
          toast.success("Redaction pasted to screen");
      }
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
        const content_desc = "content-desc" in node ? node["content-desc"] : "";
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
          content_desc,
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
        createRedaction,
        updateRedaction,
      }}
    >
      <div className="relative flex items-center w-full h-full bg-neutral-50 dark:bg-neutral-950">
        <Toolbar mode={mode} setMode={setMode} />
        <Layers redactions={redactionsOnScreen} deleteRedaction={deleteRedaction} />
        <CanvasComponent
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
