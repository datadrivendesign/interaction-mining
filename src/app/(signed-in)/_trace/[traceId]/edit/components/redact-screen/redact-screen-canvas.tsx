"use client";

import { useState, useRef, createContext, useCallback, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import CanvasComponent, { CanvasRef } from "./canvas";
import { TraceFormData, Redaction } from "../types";
import Toolbar from "./toolbar";
import Layers from "./layers";

import { useHotkeys } from "react-hotkeys-hook";
import { Screen } from "@prisma/client";

type RedactCanvasMode = "pencil" | "eraser" | "select";

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

export default function RedactScreenCanvas({ screen }: { screen: Screen }) {
  const { setValue } = useFormContext<TraceFormData>();
  const [watchRedactions] = useWatch({
    name: ["redactions"],
  });
  const redactions = watchRedactions || {};
  const redaction: Redaction[] = redactions[screen.id] || [];
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
    [redactions, setValue, screen.id]
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
          mode={mode}
        />
      </div>
    </RedactCanvasContext.Provider>
  );
}
