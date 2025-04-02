"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Pencil, Eraser } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { TraceFormData } from "../../page";
import { FrameData } from "../extract-frames";
import { HotKeys } from "react-hotkeys";

export interface Redaction {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function RedactScreenCanvas({
  screen,
  // redactions,
  // onRedactionsChange,
}: {
  screen: FrameData;
  // redactions: Redaction[];
  // onRedactionsChange: (screenId: string, newRedactions: Redaction[]) => void;
}) {
  const { watch, setValue } = useFormContext<TraceFormData>();

  const redactions = watch("redactions") as { [screenId: string]: Redaction[] };

  const onRedactionsChange = (screenId: string, newRedactions: Redaction[]) => {
    setValue("redactions", {
      ...redactions,
      [screenId]: newRedactions,
    });
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(new Image());

  const [mode, setMode] = useState<"pencil" | "eraser">("pencil");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [currentRect, setCurrentRect] = useState<Redaction | null>(null);

  // Load base image once
  useEffect(() => {
    const img = imgRef.current;
    img.src = screen.url;
    img.onload = redrawCanvas;
  }, [screen.url]);

  // Re‑draw whenever redactions or transient rect changes
  useEffect(() => {
    redrawCanvas();
  }, [redactions, currentRect]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img.complete) return;

    const ctx = canvas.getContext("2d")!;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw original
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw saved redactions
    ctx.fillStyle = "black";

    // Check if redactions exist for the current screen,
    if (redactions[screen.id]) {
      redactions[screen.id].forEach((r) => {
        ctx.fillRect(
          r.x * canvas.width,
          r.y * canvas.height,
          r.width * canvas.width,
          r.height * canvas.height
        );
      });
    } else {
      onRedactionsChange(screen.id, []);
    }

    // Draw in‑progress rectangle
    if (currentRect) {
      ctx.globalAlpha = 0.5;
      ctx.fillRect(
        currentRect.x * canvas.width,
        currentRect.y * canvas.height,
        currentRect.width * canvas.width,
        currentRect.height * canvas.height
      );
      ctx.globalAlpha = 1;
    }
  }, [redactions, currentRect, screen.id]);

  const toNormalized = (evt: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) / rect.width,
      y: (evt.clientY - rect.top) / rect.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode === "pencil") {
      const { x, y } = toNormalized(e);
      setStartPos({ x, y });
      setCurrentRect({ x, y, width: 0, height: 0 });
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing && currentRect) {
      const { x, y } = toNormalized(e);
      setCurrentRect({
        x: Math.min(startPos.x, x),
        y: Math.min(startPos.y, y),
        width: Math.abs(x - startPos.x),
        height: Math.abs(y - startPos.y),
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect) {
      onRedactionsChange(screen.id, [...redactions[screen.id], currentRect]);
      setCurrentRect(null);
      setIsDrawing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (mode === "eraser") {
      const { x, y } = toNormalized(e);
      const idx = redactions[screen.id].findIndex(
        (r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
      );
      if (idx >= 0)
        onRedactionsChange(
          screen.id,
          redactions[screen.id].filter((_, i) => i !== idx)
        );
    }
  };

  const keymap = {
    PENCIL: "p",
    ERASER: "e",
    CANCEL: "esc",
  };
  const handlers = {
    PENCIL: () => setMode("pencil"),
    ERASER: () => setMode("eraser"),
    CANCEL: () => {
      setIsDrawing(false);
      setCurrentRect(null);
    },
  };

  return (
    <HotKeys keyMap={keymap} handlers={handlers} className="w-full h-full" tabIndex={0}>
      <div className="flex items-center h-full w-full p-4">
        <aside className="flex flex-col justify-center items-center bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg shadow-lg">
          <button
            onClick={() => setMode("pencil")}
            className={`p-2 rounded ${mode === "pencil" ? "bg-blue-500 text-white" : ""}`}
          >
            <Pencil className="size-5" />
          </button>
          <button
            onClick={() => setMode("eraser")}
            className={`p-2 rounded ${mode === "eraser" ? "bg-blue-500 text-white" : ""}`}
          >
            <Eraser className="size-5" />
          </button>
        </aside>

        <div className="relative flex justify-center items-center w-full h-full">
          <canvas
            ref={canvasRef}
            className="w-fit h-full cursor-crosshair rounded-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            style={{ cursor: mode === "eraser" ? "pointer" : "crosshair" }}
          />
        </div>
      </div>
    </HotKeys>
  );
}
